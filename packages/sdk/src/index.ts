// @agent-gate/sdk — TypeScript client for AgentGate

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface AgentGateConfig {
  /** API base URL (default: "https://api.agentgate.online") */
  apiUrl?: string;
  /** Fulfillment API base URL (default: "https://fulfill.agentgate.online") */
  fulfillUrl?: string;
  /** Custom fetch implementation */
  fetch?: typeof fetch;
}

export interface DiscoverOptions {
  category?: string;
  limit?: number;
}

export interface DiscoverResult {
  endpoints: EndpointInfo[];
  total: number;
}

export interface EndpointInfo {
  id: string;
  url: string;
  method: string;
  description: string;
  category: string;
  price_usdc: string;
  active: boolean;
}

export interface CategoryResult {
  categories: Array<{ category: string; count: number }>;
}

export interface CallOptions {
  /** x402 payment header (if you already have one) */
  paymentHeader?: string;
  /** Request timeout in ms (default: 30000) */
  timeout?: number;
  /** Additional headers */
  headers?: Record<string, string>;
}

export interface CallResult<T = unknown> {
  status: number;
  data?: T;
  /** Present when status is 402 — contains payment requirements */
  paymentRequired?: {
    price: string;
    network: string;
    payTo: string;
    scheme: string;
  };
}

/* ------------------------------------------------------------------ */
/*  Client                                                             */
/* ------------------------------------------------------------------ */

const DEFAULT_API_URL = "https://api.agentgate.online";
const DEFAULT_FULFILL_URL = "https://fulfill.agentgate.online";
const DEFAULT_TIMEOUT = 30_000;

export class AgentGateClient {
  private readonly apiUrl: string;
  private readonly fulfillUrl: string;
  private readonly _fetch: typeof fetch;

  constructor(config: AgentGateConfig = {}) {
    this.apiUrl = (config.apiUrl ?? DEFAULT_API_URL).replace(/\/+$/, "");
    this.fulfillUrl = (config.fulfillUrl ?? DEFAULT_FULFILL_URL).replace(/\/+$/, "");
    this._fetch = config.fetch ?? globalThis.fetch;
  }

  /* ---------- discover ---------- */

  async discover(query?: string, options?: DiscoverOptions): Promise<DiscoverResult> {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (options?.category) params.set("category", options.category);
    if (options?.limit !== undefined) params.set("limit", String(options.limit));

    const qs = params.toString();
    const url = `${this.apiUrl}/v1/discover${qs ? `?${qs}` : ""}`;

    const res = await this._fetch(url, {
      method: "GET",
      headers: { "Accept": "application/json" },
    });

    if (!res.ok) {
      throw new Error(`discover failed: ${res.status} ${res.statusText}`);
    }

    return (await res.json()) as DiscoverResult;
  }

  /* ---------- categories ---------- */

  async categories(): Promise<CategoryResult> {
    const url = `${this.apiUrl}/v1/discover/categories`;

    const res = await this._fetch(url, {
      method: "GET",
      headers: { "Accept": "application/json" },
    });

    if (!res.ok) {
      throw new Error(`categories failed: ${res.status} ${res.statusText}`);
    }

    return (await res.json()) as CategoryResult;
  }

  /* ---------- call ---------- */

  async call<T = unknown>(
    path: string,
    data: unknown,
    options?: CallOptions,
  ): Promise<CallResult<T>> {
    const url = `${this.fulfillUrl}${path}`;
    const timeout = options?.timeout ?? DEFAULT_TIMEOUT;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...options?.headers,
    };

    if (options?.paymentHeader) {
      headers["X-PAYMENT"] = options.paymentHeader;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await this._fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      if (res.status === 402) {
        // Parse x402 payment requirements from response body or headers
        let paymentRequired: CallResult["paymentRequired"] | undefined;

        try {
          const body = await res.json() as Record<string, unknown>;
          paymentRequired = {
            price: String(body.price ?? ""),
            network: String(body.network ?? ""),
            payTo: String(body.payTo ?? ""),
            scheme: String(body.scheme ?? ""),
          };
        } catch {
          // Fall back to headers
          paymentRequired = {
            price: res.headers.get("X-PAYMENT-PRICE") ?? "",
            network: res.headers.get("X-PAYMENT-NETWORK") ?? "",
            payTo: res.headers.get("X-PAYMENT-PAY-TO") ?? "",
            scheme: res.headers.get("X-PAYMENT-SCHEME") ?? "",
          };
        }

        return { status: 402, paymentRequired };
      }

      if (!res.ok) {
        throw new Error(`call failed: ${res.status} ${res.statusText}`);
      }

      const responseData = (await res.json()) as T;
      return { status: res.status, data: responseData };
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new Error(`call timed out after ${timeout}ms`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  /* ---------- endpoint ---------- */

  async endpoint(path: string): Promise<EndpointInfo | null> {
    const result = await this.discover(path);
    return result.endpoints.find((ep) => ep.url === path) ?? null;
  }
}
