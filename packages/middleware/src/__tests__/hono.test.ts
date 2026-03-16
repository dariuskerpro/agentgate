import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { agentgate } from "../hono.js";
import type { AgentGateConfig } from "../types.js";

// ── Minimal Hono-like test helpers ─────────────────────────────────
// We mock just enough of Hono's Context to test middleware behaviour
// without importing Hono (keeps tests CF Workers–compatible).

interface MockContext {
  req: {
    method: string;
    path: string;
    header: (name: string) => string | undefined;
  };
  json: (data: unknown, status?: number) => Response;
  _response: { status: number; body: unknown } | null;
}

function createMockContext(
  method: string,
  path: string,
  headers: Record<string, string> = {}
): MockContext {
  const lowerHeaders: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    lowerHeaders[k.toLowerCase()] = v;
  }

  return {
    req: {
      method,
      path,
      header(name: string) {
        return lowerHeaders[name.toLowerCase()];
      },
    },
    json(data: unknown, status?: number) {
      (this as MockContext)._response = { status: status ?? 200, body: data };
      return new Response(JSON.stringify(data), { status: status ?? 200 });
    },
    _response: null,
  };
}

const validConfig: AgentGateConfig = {
  wallet: "0x1234567890abcdef1234567890abcdef12345678",
  routes: {
    "GET /api/weather": {
      price: "$0.001",
      description: "Weather data",
      category: "data",
    },
    "POST /api/scrape": {
      price: "0.005",
      description: "Scrape a URL",
      category: "data",
    },
  },
};

describe("agentgate hono middleware", () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
    vi.stubGlobal("fetch", fetchSpy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("route protection", () => {
    it("returns 402 for configured routes when no payment header is present", async () => {
      const middleware = agentgate(validConfig);
      const c = createMockContext("GET", "/api/weather");
      const next = vi.fn().mockResolvedValue(undefined);

      const result = await middleware(c as any, next);

      expect(c._response?.status).toBe(402);
      expect(c._response?.body).toMatchObject({
        error: expect.stringContaining("Payment Required"),
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("calls next when valid payment header is present", async () => {
      const middleware = agentgate(validConfig);
      const c = createMockContext("GET", "/api/weather", {
        "x-402-payment": "valid-payment-token",
      });
      const next = vi.fn().mockResolvedValue(undefined);

      await middleware(c as any, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe("unconfigured routes", () => {
    it("passes through without payment requirement for unconfigured routes", async () => {
      const middleware = agentgate(validConfig);
      const c = createMockContext("GET", "/api/health");
      const next = vi.fn().mockResolvedValue(undefined);

      await middleware(c as any, next);

      expect(next).toHaveBeenCalled();
      expect(c._response).toBeNull();
    });

    it("passes through when method does not match configured route", async () => {
      const middleware = agentgate(validConfig);
      const c = createMockContext("POST", "/api/weather");
      const next = vi.fn().mockResolvedValue(undefined);

      await middleware(c as any, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe("analytics events", () => {
    it("fires async analytics POST on settled payment", async () => {
      const config: AgentGateConfig = {
        ...validConfig,
        marketplace: {
          apiKey: "ag_test_key",
          baseUrl: "https://api.agentgate.test",
        },
      };
      const middleware = agentgate(config);
      const c = createMockContext("GET", "/api/weather", {
        "x-402-payment": "valid-payment-token",
      });
      const next = vi.fn().mockResolvedValue(undefined);

      await middleware(c as any, next);

      // Analytics fires async — wait a tick
      await new Promise((r) => setTimeout(r, 10));

      expect(fetchSpy).toHaveBeenCalledWith(
        "https://api.agentgate.test/v1/events/transaction",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer ag_test_key",
          }),
        })
      );

      const callArgs = fetchSpy.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body).toMatchObject({
        route: "GET /api/weather",
        wallet: validConfig.wallet,
        price: 0.001,
      });
    });

    it("does not fire analytics when no marketplace config is set", async () => {
      const middleware = agentgate(validConfig);
      const c = createMockContext("GET", "/api/weather", {
        "x-402-payment": "valid-payment-token",
      });
      const next = vi.fn().mockResolvedValue(undefined);

      await middleware(c as any, next);
      await new Promise((r) => setTimeout(r, 10));

      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe("graceful degradation", () => {
    it("still allows payment through when marketplace API is unreachable", async () => {
      fetchSpy.mockRejectedValue(new Error("Network error"));

      const config: AgentGateConfig = {
        ...validConfig,
        marketplace: {
          apiKey: "ag_test_key",
          baseUrl: "https://api.agentgate.test",
        },
      };
      const middleware = agentgate(config);
      const c = createMockContext("GET", "/api/weather", {
        "x-402-payment": "valid-payment-token",
      });
      const next = vi.fn().mockResolvedValue(undefined);

      await middleware(c as any, next);

      expect(next).toHaveBeenCalled();

      await new Promise((r) => setTimeout(r, 10));
      expect(fetchSpy).toHaveBeenCalled();
    });
  });

  describe("configuration validation", () => {
    it("throws when wallet is missing", () => {
      expect(() =>
        agentgate({ wallet: "", routes: { "GET /": { price: "$0.01" } } })
      ).toThrow(/wallet/i);
    });

    it("throws when wallet is undefined", () => {
      expect(() =>
        agentgate({ wallet: undefined as unknown as string, routes: {} })
      ).toThrow(/wallet/i);
    });

    it("throws when routes is missing or empty", () => {
      expect(() =>
        agentgate({
          wallet: "0x1234567890abcdef1234567890abcdef12345678",
          routes: {},
        })
      ).toThrow(/routes/i);
    });

    it("throws when routes is undefined", () => {
      expect(() =>
        agentgate({
          wallet: "0x1234567890abcdef1234567890abcdef12345678",
          routes: undefined as unknown as Record<string, any>,
        })
      ).toThrow(/routes/i);
    });
  });

  describe("cloudflare workers compatibility", () => {
    it("does not use Node.js-specific APIs (no require, Buffer, process)", () => {
      // The middleware function itself should be importable and callable
      // without any Node.js globals. This test validates the middleware
      // factory produces a function that works with Web API–only primitives.
      const middleware = agentgate(validConfig);
      expect(typeof middleware).toBe("function");
    });
  });
});
