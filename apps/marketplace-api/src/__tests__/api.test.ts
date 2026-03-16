import { describe, it, expect, beforeEach } from "vitest";
import { createApp } from "../app.js";
import { createMockRepositories } from "../repositories/mock.js";
import type { Repositories } from "../repositories/types.js";

let repos: ReturnType<typeof createMockRepositories>;
let app: ReturnType<typeof createApp>;

// Helper: register a seller and return the API key
async function registerSeller(wallet = "0xabc123") {
  const res = await app.request("/v1/sellers/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet_address: wallet }),
  });
  return (await res.json()) as any;
}

// Helper: make an authed request
function authedRequest(
  path: string,
  apiKey: string,
  options: RequestInit = {},
) {
  return app.request(path, {
    ...options,
    headers: {
      ...((options.headers as Record<string, string>) ?? {}),
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });
}

beforeEach(() => {
  repos = createMockRepositories();
  app = createApp(repos);
});

// ────────────────────────────────────────────────────────
// AG-007: Seller Registration
// ────────────────────────────────────────────────────────
describe("POST /v1/sellers/register", () => {
  it("registers with wallet address and returns API key", async () => {
    const res = await app.request("/v1/sellers/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet_address: "0xdeadbeef" }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as any;
    expect(body.wallet_address).toBe("0xdeadbeef");
    expect(body.api_key).toMatch(/^ag_[a-f0-9]{32}$/);
    expect(body.id).toBeDefined();
  });

  it("returns existing API key for duplicate wallet", async () => {
    const first = await registerSeller("0xdup");
    const res = await app.request("/v1/sellers/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet_address: "0xdup" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.api_key).toBe(first.api_key);
  });

  it("API key format is ag_ + 32 hex chars", async () => {
    const seller = await registerSeller("0xformat");
    expect(seller.api_key).toMatch(/^ag_[a-f0-9]{32}$/);
  });

  it("returns 400 if wallet_address is missing", async () => {
    const res = await app.request("/v1/sellers/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });
});

// ────────────────────────────────────────────────────────
// AG-007: GET /v1/sellers/me
// ────────────────────────────────────────────────────────
describe("GET /v1/sellers/me", () => {
  it("returns seller profile with correct fields", async () => {
    const seller = await registerSeller("0xme");
    const res = await authedRequest("/v1/sellers/me", seller.api_key);
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.id).toBeDefined();
    expect(body.wallet_address).toBe("0xme");
    expect(body.verified).toBe(false);
  });

  it("rejects missing auth header", async () => {
    const res = await app.request("/v1/sellers/me");
    expect(res.status).toBe(401);
  });

  it("rejects invalid API key", async () => {
    const res = await authedRequest("/v1/sellers/me", "ag_invalidkey00000000000000000000");
    expect(res.status).toBe(401);
  });
});

// ────────────────────────────────────────────────────────
// AG-006: POST /v1/endpoints
// ────────────────────────────────────────────────────────
describe("POST /v1/endpoints", () => {
  it("creates an endpoint and returns 201", async () => {
    const seller = await registerSeller();
    const res = await authedRequest("/v1/endpoints", seller.api_key, {
      method: "POST",
      body: JSON.stringify({
        url: "https://api.example.com/weather",
        category: "data",
        price_usdc: "0.001",
        description: "Weather data",
        method: "GET",
      }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as any;
    expect(body.url).toBe("https://api.example.com/weather");
    expect(body.category).toBe("data");
    expect(body.active).toBe(true);
  });

  it("validates required fields", async () => {
    const seller = await registerSeller();
    const res = await authedRequest("/v1/endpoints", seller.api_key, {
      method: "POST",
      body: JSON.stringify({ url: "https://example.com" }),
    });
    expect(res.status).toBe(400);
  });

  it("rejects unauthenticated requests", async () => {
    const res = await app.request("/v1/endpoints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: "https://example.com",
        category: "data",
        price_usdc: "0.001",
      }),
    });
    expect(res.status).toBe(401);
  });
});

// ────────────────────────────────────────────────────────
// AG-006: GET /v1/endpoints/mine
// ────────────────────────────────────────────────────────
describe("GET /v1/endpoints/mine", () => {
  it("returns seller's own endpoints", async () => {
    const seller = await registerSeller();
    // Create an endpoint
    await authedRequest("/v1/endpoints", seller.api_key, {
      method: "POST",
      body: JSON.stringify({
        url: "https://mine.com/api",
        category: "data",
        price_usdc: "0.01",
      }),
    });
    const res = await authedRequest("/v1/endpoints/mine", seller.api_key);
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.endpoints).toHaveLength(1);
  });

  it("rejects unauthenticated requests", async () => {
    const res = await app.request("/v1/endpoints/mine");
    expect(res.status).toBe(401);
  });
});

// ────────────────────────────────────────────────────────
// AG-006: PUT /v1/endpoints/:id
// ────────────────────────────────────────────────────────
describe("PUT /v1/endpoints/:id", () => {
  it("updates an endpoint owned by seller", async () => {
    const seller = await registerSeller();
    const createRes = await authedRequest("/v1/endpoints", seller.api_key, {
      method: "POST",
      body: JSON.stringify({
        url: "https://update.com/api",
        category: "data",
        price_usdc: "0.01",
      }),
    });
    const ep = (await createRes.json()) as any;
    const res = await authedRequest(`/v1/endpoints/${ep.id}`, seller.api_key, {
      method: "PUT",
      body: JSON.stringify({ description: "Updated description" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.description).toBe("Updated description");
  });

  it("returns 403 if seller does not own the endpoint", async () => {
    const seller1 = await registerSeller("0xowner");
    const seller2 = await registerSeller("0xother");
    const createRes = await authedRequest("/v1/endpoints", seller1.api_key, {
      method: "POST",
      body: JSON.stringify({
        url: "https://owned.com/api",
        category: "data",
        price_usdc: "0.01",
      }),
    });
    const ep = (await createRes.json()) as any;
    const res = await authedRequest(`/v1/endpoints/${ep.id}`, seller2.api_key, {
      method: "PUT",
      body: JSON.stringify({ description: "Hijack attempt" }),
    });
    expect(res.status).toBe(403);
  });

  it("returns 404 for non-existent endpoint", async () => {
    const seller = await registerSeller();
    const res = await authedRequest(
      `/v1/endpoints/00000000-0000-0000-0000-000000000000`,
      seller.api_key,
      { method: "PUT", body: JSON.stringify({ description: "nope" }) },
    );
    expect(res.status).toBe(404);
  });
});

// ────────────────────────────────────────────────────────
// AG-006: DELETE /v1/endpoints/:id
// ────────────────────────────────────────────────────────
describe("DELETE /v1/endpoints/:id", () => {
  it("soft-deletes (sets active=false)", async () => {
    const seller = await registerSeller();
    const createRes = await authedRequest("/v1/endpoints", seller.api_key, {
      method: "POST",
      body: JSON.stringify({
        url: "https://delete.com/api",
        category: "data",
        price_usdc: "0.01",
      }),
    });
    const ep = (await createRes.json()) as any;
    const res = await authedRequest(`/v1/endpoints/${ep.id}`, seller.api_key, {
      method: "DELETE",
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.endpoint.active).toBe(false);
  });

  it("returns 403 if not the owner", async () => {
    const seller1 = await registerSeller("0xdelowner");
    const seller2 = await registerSeller("0xdelother");
    const createRes = await authedRequest("/v1/endpoints", seller1.api_key, {
      method: "POST",
      body: JSON.stringify({
        url: "https://delowned.com/api",
        category: "data",
        price_usdc: "0.01",
      }),
    });
    const ep = (await createRes.json()) as any;
    const res = await authedRequest(`/v1/endpoints/${ep.id}`, seller2.api_key, {
      method: "DELETE",
    });
    expect(res.status).toBe(403);
  });
});

// ────────────────────────────────────────────────────────
// AG-006: Discovery endpoints (public, no auth)
// ────────────────────────────────────────────────────────
describe("GET /v1/discover", () => {
  async function seedEndpoints() {
    const seller = await registerSeller("0xdiscover");
    const endpoints = [
      { url: "https://a.com/weather", category: "data", price_usdc: "0.001", description: "Weather data" },
      { url: "https://b.com/scrape", category: "compute", price_usdc: "0.005", description: "Web scraper" },
      { url: "https://c.com/ml", category: "ml", price_usdc: "0.01", description: "ML inference" },
      { url: "https://d.com/weather2", category: "data", price_usdc: "0.002", description: "Advanced weather" },
    ];
    for (const ep of endpoints) {
      await authedRequest("/v1/endpoints", seller.api_key, {
        method: "POST",
        body: JSON.stringify(ep),
      });
    }
    return seller;
  }

  it("returns all active endpoints without auth", async () => {
    await seedEndpoints();
    const res = await app.request("/v1/discover");
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.endpoints).toHaveLength(4);
    expect(body.total).toBe(4);
  });

  it("filters by category", async () => {
    await seedEndpoints();
    const res = await app.request("/v1/discover?category=data");
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.endpoints).toHaveLength(2);
    expect(body.endpoints.every((e: any) => e.category === "data")).toBe(true);
  });

  it("searches by keyword (q param)", async () => {
    await seedEndpoints();
    const res = await app.request("/v1/discover?q=weather");
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.endpoints.length).toBeGreaterThanOrEqual(2);
  });

  it("supports pagination (limit/offset)", async () => {
    await seedEndpoints();
    const res = await app.request("/v1/discover?limit=2&offset=0");
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.endpoints).toHaveLength(2);
    expect(body.total).toBe(4);
    expect(body.limit).toBe(2);
    expect(body.offset).toBe(0);

    const res2 = await app.request("/v1/discover?limit=2&offset=2");
    const body2 = (await res2.json()) as any;
    expect(body2.endpoints).toHaveLength(2);
  });

  it("sorts by price", async () => {
    await seedEndpoints();
    const res = await app.request("/v1/discover?sort=price");
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    const prices = body.endpoints.map((e: any) => Number(e.price_usdc));
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
    }
  });
});

describe("GET /v1/discover/:id", () => {
  it("returns endpoint details", async () => {
    const seller = await registerSeller();
    const createRes = await authedRequest("/v1/endpoints", seller.api_key, {
      method: "POST",
      body: JSON.stringify({
        url: "https://detail.com/api",
        category: "data",
        price_usdc: "0.001",
      }),
    });
    const ep = (await createRes.json()) as any;
    const res = await app.request(`/v1/discover/${ep.id}`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.url).toBe("https://detail.com/api");
  });

  it("returns 404 for non-existent endpoint", async () => {
    const res = await app.request(
      "/v1/discover/00000000-0000-0000-0000-000000000000",
    );
    expect(res.status).toBe(404);
  });

  it("returns 404 for deactivated endpoint", async () => {
    const seller = await registerSeller();
    const createRes = await authedRequest("/v1/endpoints", seller.api_key, {
      method: "POST",
      body: JSON.stringify({
        url: "https://deactivated.com/api",
        category: "data",
        price_usdc: "0.001",
      }),
    });
    const ep = (await createRes.json()) as any;
    // Deactivate it
    await authedRequest(`/v1/endpoints/${ep.id}`, seller.api_key, {
      method: "DELETE",
    });
    const res = await app.request(`/v1/discover/${ep.id}`);
    expect(res.status).toBe(404);
  });
});

describe("GET /v1/discover/categories", () => {
  it("returns category names with endpoint counts", async () => {
    const seller = await registerSeller();
    await authedRequest("/v1/endpoints", seller.api_key, {
      method: "POST",
      body: JSON.stringify({ url: "https://cat1.com/a", category: "data", price_usdc: "0.001" }),
    });
    await authedRequest("/v1/endpoints", seller.api_key, {
      method: "POST",
      body: JSON.stringify({ url: "https://cat2.com/b", category: "data", price_usdc: "0.002" }),
    });
    await authedRequest("/v1/endpoints", seller.api_key, {
      method: "POST",
      body: JSON.stringify({ url: "https://cat3.com/c", category: "ml", price_usdc: "0.01" }),
    });

    const res = await app.request("/v1/discover/categories");
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.categories).toBeDefined();
    const dataCategory = body.categories.find((c: any) => c.category === "data");
    expect(dataCategory).toBeDefined();
    expect(dataCategory.count).toBe(2);
    const mlCategory = body.categories.find((c: any) => c.category === "ml");
    expect(mlCategory).toBeDefined();
    expect(mlCategory.count).toBe(1);
  });

  it("works without auth", async () => {
    const res = await app.request("/v1/discover/categories");
    expect(res.status).toBe(200);
  });
});

// ────────────────────────────────────────────────────────
// AG-006: Transaction events
// ────────────────────────────────────────────────────────
describe("POST /v1/events/transaction", () => {
  it("records a transaction event", async () => {
    const seller = await registerSeller();
    const createRes = await authedRequest("/v1/endpoints", seller.api_key, {
      method: "POST",
      body: JSON.stringify({
        url: "https://tx.com/api",
        category: "data",
        price_usdc: "0.001",
      }),
    });
    const ep = (await createRes.json()) as any;

    const res = await authedRequest("/v1/events/transaction", seller.api_key, {
      method: "POST",
      body: JSON.stringify({
        endpoint_id: ep.id,
        buyer_wallet: "0xbuyer123",
        amount_usdc: "0.001",
        tx_hash: "0xtxhash",
        latency_ms: 142,
      }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as any;
    expect(body.endpoint_id).toBe(ep.id);
    expect(body.buyer_wallet).toBe("0xbuyer123");
    expect(body.status).toBe("settled");
  });

  it("validates required fields", async () => {
    const seller = await registerSeller();
    const res = await authedRequest("/v1/events/transaction", seller.api_key, {
      method: "POST",
      body: JSON.stringify({ endpoint_id: "some-id" }),
    });
    expect(res.status).toBe(400);
  });

  it("rejects unauthenticated requests", async () => {
    const res = await app.request("/v1/events/transaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint_id: "x",
        buyer_wallet: "0x",
        amount_usdc: "0.001",
      }),
    });
    expect(res.status).toBe(401);
  });
});

// ────────────────────────────────────────────────────────
// AG-006: Health check
// ────────────────────────────────────────────────────────
describe("GET /health", () => {
  it("returns ok", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.status).toBe("ok");
  });
});
