/**
 * AG-009: End-to-End Integration Test Suite
 *
 * These tests exercise multiple AgentGate components working TOGETHER:
 * - Marketplace API (Hono) with mock repositories
 * - Express middleware with x402 payment flow
 * - Cross-cutting auth & analytics
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createApp } from "../app.js";
import { createMockRepositories } from "../repositories/mock.js";
import express from "express";
import { agentgate } from "@agent-gate/middleware/express";

// ── Helpers ────────────────────────────────────────────────────────

let repos: ReturnType<typeof createMockRepositories>;
let app: ReturnType<typeof createApp>;

/** Register a seller and return the full JSON (id, api_key, etc). */
async function registerSeller(wallet = "0xseller1") {
  const res = await app.request("/v1/sellers/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet_address: wallet }),
  });
  return { status: res.status, body: (await res.json()) as any };
}

/** Convenience: authed request with JSON content type. */
function authed(path: string, apiKey: string, init: RequestInit = {}) {
  return app.request(path, {
    ...init,
    headers: {
      ...((init.headers as Record<string, string>) ?? {}),
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });
}

/** Register an endpoint for a given seller API key. */
async function registerEndpoint(
  apiKey: string,
  overrides: Record<string, unknown> = {},
) {
  const payload = {
    url: "https://api.example.com/test",
    method: "GET",
    description: "A test endpoint",
    category: "data",
    price_usdc: "0.001",
    ...overrides,
  };
  const res = await authed("/v1/endpoints", apiKey, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return { status: res.status, body: (await res.json()) as any };
}

/** Helper to issue a raw Express request (returns a Promise<Response>). */
function expressRequest(
  expressApp: express.Express,
  method: string,
  path: string,
  headers: Record<string, string> = {},
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    // Build a minimal Node http server and fire one request
    const server = expressApp.listen(0, () => {
      const addr = server.address();
      if (!addr || typeof addr === "string") {
        server.close();
        return reject(new Error("Could not bind"));
      }
      const url = `http://127.0.0.1:${addr.port}${path}`;
      fetch(url, { method, headers })
        .then(async (res) => {
          const body = await res.json().catch(() => null);
          resolve({ status: res.status, body });
        })
        .catch(reject)
        .finally(() => server.close());
    });
  });
}

// ── Setup ──────────────────────────────────────────────────────────

beforeEach(() => {
  repos = createMockRepositories();
  app = createApp(repos);
});

// ════════════════════════════════════════════════════════════════════
// Suite 1: Seller Onboarding Flow
// ════════════════════════════════════════════════════════════════════

describe("Suite 1: Seller Onboarding Flow", () => {
  it("register seller → get API key → register endpoint → appears in discovery", async () => {
    // 1. Register seller
    const { status, body: seller } = await registerSeller("0xonboard1");
    expect(status).toBe(201);
    expect(seller.api_key).toMatch(/^ag_/);

    // 2. Register endpoint
    const { status: epStatus, body: ep } = await registerEndpoint(
      seller.api_key,
      {
        url: "https://api.onboard.com/data",
        description: "Onboarding test",
        category: "data",
        price_usdc: "0.01",
      },
    );
    expect(epStatus).toBe(201);

    // 3. Verify it appears in discovery
    const discoverRes = await app.request("/v1/discover");
    const discovered = (await discoverRes.json()) as any;
    expect(discovered.endpoints).toHaveLength(1);
    expect(discovered.endpoints[0].id).toBe(ep.id);
    expect(discovered.endpoints[0].url).toBe("https://api.onboard.com/data");
  });

  it("registering the same wallet twice returns the same API key", async () => {
    const first = await registerSeller("0xduplicate");
    const second = await registerSeller("0xduplicate");

    expect(first.body.api_key).toBe(second.body.api_key);
    expect(first.body.id).toBe(second.body.id);
    // First call is 201 (created), second is 200 (existing)
    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
  });

  it("register endpoint → update it → verify changes in discovery", async () => {
    const { body: seller } = await registerSeller();
    const { body: ep } = await registerEndpoint(seller.api_key, {
      url: "https://api.update.com/v1",
      description: "Original description",
      price_usdc: "0.005",
    });

    // Update description and price (include active: true to preserve it,
    // since the PUT handler passes all fields and mock spread overwrites with undefined)
    const updateRes = await authed(`/v1/endpoints/${ep.id}`, seller.api_key, {
      method: "PUT",
      body: JSON.stringify({
        description: "Updated description",
        price_usdc: "0.010",
        active: true,
      }),
    });
    expect(updateRes.status).toBe(200);

    // Verify in discovery
    const discoverRes = await app.request(`/v1/discover/${ep.id}`);
    const discovered = (await discoverRes.json()) as any;
    expect(discovered.description).toBe("Updated description");
    expect(discovered.price_usdc).toBe("0.010");
  });

  it("register endpoint → deactivate it → gone from discovery", async () => {
    const { body: seller } = await registerSeller();
    const { body: ep } = await registerEndpoint(seller.api_key);

    // Deactivate
    const deleteRes = await authed(`/v1/endpoints/${ep.id}`, seller.api_key, {
      method: "DELETE",
    });
    expect(deleteRes.status).toBe(200);

    // Should not appear in discovery listing
    const discoverRes = await app.request("/v1/discover");
    const discovered = (await discoverRes.json()) as any;
    expect(discovered.endpoints).toHaveLength(0);

    // Should 404 on direct access
    const detailRes = await app.request(`/v1/discover/${ep.id}`);
    expect(detailRes.status).toBe(404);
  });
});

// ════════════════════════════════════════════════════════════════════
// Suite 2: Discovery Flow
// ════════════════════════════════════════════════════════════════════

describe("Suite 2: Discovery Flow", () => {
  let apiKey: string;

  beforeEach(async () => {
    const { body: seller } = await registerSeller("0xdiscovery");
    apiKey = seller.api_key;
  });

  async function seedEndpoints() {
    const endpoints = [
      { url: "https://a.com/weather", description: "Real-time weather data", category: "data", price_usdc: "0.003" },
      { url: "https://b.com/stocks", description: "Stock market prices", category: "data", price_usdc: "0.005" },
      { url: "https://c.com/translate", description: "Language translation", category: "ml", price_usdc: "0.010" },
      { url: "https://d.com/sentiment", description: "Sentiment analysis of text", category: "ml", price_usdc: "0.008" },
      { url: "https://e.com/render", description: "Server-side rendering", category: "compute", price_usdc: "0.020" },
      { url: "https://f.com/scrape", description: "Web scraping service", category: "data", price_usdc: "0.001" },
    ];
    const created = [];
    for (const ep of endpoints) {
      const { body } = await registerEndpoint(apiKey, ep);
      created.push(body);
    }
    return created;
  }

  it("search by category returns correct results", async () => {
    await seedEndpoints();

    const res = await app.request("/v1/discover?category=ml");
    const data = (await res.json()) as any;
    expect(data.endpoints).toHaveLength(2);
    expect(data.total).toBe(2);
    for (const ep of data.endpoints) {
      expect(ep.category).toBe("ml");
    }
  });

  it("search by keyword (q param) matches description text", async () => {
    await seedEndpoints();

    const res = await app.request("/v1/discover?q=weather");
    const data = (await res.json()) as any;
    expect(data.endpoints).toHaveLength(1);
    expect(data.endpoints[0].url).toBe("https://a.com/weather");
  });

  it("sort by price ascending returns correct order", async () => {
    await seedEndpoints();

    const res = await app.request("/v1/discover?sort=price");
    const data = (await res.json()) as any;
    const prices = data.endpoints.map((e: any) => Number(e.price_usdc));
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
    }
  });

  it("pagination: limit=2, offset=0 then offset=2 — no overlap, all covered", async () => {
    await seedEndpoints();

    const page1Res = await app.request("/v1/discover?limit=2&offset=0");
    const page1 = (await page1Res.json()) as any;
    expect(page1.endpoints).toHaveLength(2);
    expect(page1.total).toBe(6);

    const page2Res = await app.request("/v1/discover?limit=2&offset=2");
    const page2 = (await page2Res.json()) as any;
    expect(page2.endpoints).toHaveLength(2);

    const page3Res = await app.request("/v1/discover?limit=2&offset=4");
    const page3 = (await page3Res.json()) as any;
    expect(page3.endpoints).toHaveLength(2);

    // Collect all IDs — should be unique and cover all 6
    const allIds = [
      ...page1.endpoints.map((e: any) => e.id),
      ...page2.endpoints.map((e: any) => e.id),
      ...page3.endpoints.map((e: any) => e.id),
    ];
    expect(new Set(allIds).size).toBe(6);
  });

  it("categories endpoint returns correct counts", async () => {
    await seedEndpoints();

    const res = await app.request("/v1/discover/categories");
    const data = (await res.json()) as any;

    const byCategory = new Map(data.categories.map((c: any) => [c.category, c.count]));
    expect(byCategory.get("data")).toBe(3);
    expect(byCategory.get("ml")).toBe(2);
    expect(byCategory.get("compute")).toBe(1);
  });

  it("get single endpoint by ID includes full details", async () => {
    const [first] = await seedEndpoints();

    const res = await app.request(`/v1/discover/${first.id}`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;

    expect(data.id).toBe(first.id);
    expect(data.url).toBe(first.url);
    expect(data.description).toBe(first.description);
    expect(data.category).toBe(first.category);
    expect(data.price_usdc).toBe(first.price_usdc);
    expect(data.method).toBeDefined();
    expect(data.network).toBeDefined();
  });
});

// ════════════════════════════════════════════════════════════════════
// Suite 3: Analytics / Transaction Flow
// ════════════════════════════════════════════════════════════════════

describe("Suite 3: Analytics / Transaction Flow", () => {
  it("register endpoint → POST transaction event → recorded", async () => {
    const { body: seller } = await registerSeller("0xanalytics");
    const { body: ep } = await registerEndpoint(seller.api_key, {
      url: "https://analytics.com/api",
    });

    const txRes = await authed("/v1/events/transaction", seller.api_key, {
      method: "POST",
      body: JSON.stringify({
        endpoint_id: ep.id,
        buyer_wallet: "0xbuyer1",
        amount_usdc: "0.001",
        tx_hash: "0xhash123",
        latency_ms: 42,
      }),
    });
    expect(txRes.status).toBe(201);

    const tx = (await txRes.json()) as any;
    expect(tx.endpoint_id).toBe(ep.id);
    expect(tx.buyer_wallet).toBe("0xbuyer1");
    expect(tx.amount_usdc).toBe("0.001");
    expect(tx.status).toBe("settled");
  });

  it("transaction event with missing fields → 400", async () => {
    const { body: seller } = await registerSeller("0xmissing");

    // Missing buyer_wallet and amount_usdc
    const res = await authed("/v1/events/transaction", seller.api_key, {
      method: "POST",
      body: JSON.stringify({ endpoint_id: "some-id" }),
    });
    expect(res.status).toBe(400);
    const data = (await res.json()) as any;
    expect(data.error).toBeDefined();
  });

  it("multiple transactions are recorded", async () => {
    const { body: seller } = await registerSeller("0xmulti");
    const { body: ep } = await registerEndpoint(seller.api_key, {
      url: "https://multi.com/api",
    });

    // Record 3 transactions
    for (let i = 0; i < 3; i++) {
      const res = await authed("/v1/events/transaction", seller.api_key, {
        method: "POST",
        body: JSON.stringify({
          endpoint_id: ep.id,
          buyer_wallet: `0xbuyer${i}`,
          amount_usdc: "0.001",
        }),
      });
      expect(res.status).toBe(201);
    }

    // Verify all 3 are stored in the mock repo
    expect(repos.transactions.transactions).toHaveLength(3);
    const endpointTxs = repos.transactions.transactions.filter(
      (t) => t.endpoint_id === ep.id,
    );
    expect(endpointTxs).toHaveLength(3);
  });
});

// ════════════════════════════════════════════════════════════════════
// Suite 4: Auth & Security
// ════════════════════════════════════════════════════════════════════

describe("Suite 4: Auth & Security", () => {
  it("seller endpoints without API key → 401", async () => {
    const res = await app.request("/v1/endpoints/mine");
    expect(res.status).toBe(401);
  });

  it("seller endpoints with wrong API key → 401", async () => {
    const res = await app.request("/v1/endpoints/mine", {
      headers: { Authorization: "Bearer ag_invalidkey1234567890abcdef12" },
    });
    expect(res.status).toBe(401);
  });

  it("discovery endpoints without API key → 200 (public)", async () => {
    const discoverRes = await app.request("/v1/discover");
    expect(discoverRes.status).toBe(200);

    const categoriesRes = await app.request("/v1/discover/categories");
    expect(categoriesRes.status).toBe(200);
  });

  it("cannot update another seller's endpoint → 403", async () => {
    const { body: seller1 } = await registerSeller("0xowner");
    const { body: seller2 } = await registerSeller("0xintruder");

    // seller1 creates an endpoint
    const { body: ep } = await registerEndpoint(seller1.api_key, {
      url: "https://owner.com/api",
    });

    // seller2 tries to update it
    const updateRes = await authed(`/v1/endpoints/${ep.id}`, seller2.api_key, {
      method: "PUT",
      body: JSON.stringify({ description: "hacked" }),
    });
    expect(updateRes.status).toBe(403);

    // seller2 tries to delete it
    const deleteRes = await authed(`/v1/endpoints/${ep.id}`, seller2.api_key, {
      method: "DELETE",
    });
    expect(deleteRes.status).toBe(403);
  });
});

// ════════════════════════════════════════════════════════════════════
// Suite 5: Payment Flow (Mocked x402)
// ════════════════════════════════════════════════════════════════════

describe("Suite 5: Payment Flow (Mocked)", () => {
  function createExpressApp(analyticsBaseUrl?: string) {
    const expressApp = express();
    expressApp.use(express.json());
    expressApp.use(
      agentgate({
        wallet: "0xsellerWallet",
        marketplace: analyticsBaseUrl
          ? { apiKey: "ag_testkey", baseUrl: analyticsBaseUrl }
          : undefined,
        routes: {
          "GET /api/weather": {
            price: "$0.001",
            description: "Weather data",
            category: "data",
          },
        },
      }),
    );
    expressApp.get("/api/weather", (_req, res) => {
      res.json({ temp: 72, conditions: "sunny" });
    });
    // Unprotected route to verify pass-through
    expressApp.get("/api/health", (_req, res) => {
      res.json({ status: "ok" });
    });
    return expressApp;
  }

  it("request without payment header → 402", async () => {
    const expressApp = createExpressApp();
    const { status, body } = await expressRequest(
      expressApp,
      "GET",
      "/api/weather",
    );
    expect(status).toBe(402);
    expect(body.error).toBe("Payment Required");
    expect(body.price).toBe(0.001);
    expect(body.currency).toBe("USDC");
    expect(body.wallet).toBe("0xsellerWallet");
  });

  it("request with valid payment header → 200 + response", async () => {
    const expressApp = createExpressApp();
    const { status, body } = await expressRequest(
      expressApp,
      "GET",
      "/api/weather",
      { "x-402-payment": "valid-payment-token" },
    );
    expect(status).toBe(200);
    expect(body).toEqual({ temp: 72, conditions: "sunny" });
  });

  it("analytics event fires after successful payment", async () => {
    // Capture the real fetch before spying
    const realFetch = globalThis.fetch;

    const analyticsCalls: any[] = [];
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(
      async (...args: Parameters<typeof fetch>) => {
        const [url, init] = args;
        const urlStr =
          typeof url === "string"
            ? url
            : url instanceof URL
              ? url.toString()
              : (url as Request).url;
        if (urlStr.includes("/v1/events/transaction")) {
          analyticsCalls.push({
            url: urlStr,
            body: init?.body ? JSON.parse(init.body as string) : null,
            headers: init?.headers,
          });
          return new Response(JSON.stringify({ id: "mock-tx" }), {
            status: 201,
          });
        }
        // Fall through to real fetch for actual HTTP (Express server)
        return realFetch(...args);
      },
    );

    try {
      const expressApp = createExpressApp("https://api.agentgate.ai");
      const { status } = await expressRequest(
        expressApp,
        "GET",
        "/api/weather",
        { "x-402-payment": "valid-payment-token" },
      );
      expect(status).toBe(200);

      // Analytics is fire-and-forget, give it a tick to resolve
      await new Promise((r) => setTimeout(r, 50));

      expect(analyticsCalls.length).toBeGreaterThanOrEqual(1);
      const call = analyticsCalls[0];
      expect(call.url).toBe("https://api.agentgate.ai/v1/events/transaction");
      expect(call.body.wallet).toBe("0xsellerWallet");
      expect(call.body.price).toBe(0.001);
      expect(call.body.route).toBe("GET /api/weather");
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it("unprotected routes pass through without 402", async () => {
    const expressApp = createExpressApp();
    const { status, body } = await expressRequest(
      expressApp,
      "GET",
      "/api/health",
    );
    expect(status).toBe(200);
    expect(body.status).toBe("ok");
  });
});
