import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  AgentGateClient,
  type AgentGateConfig,
  type DiscoverResult,
  type CategoryResult,
  type EndpointInfo,
} from "../index.js";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function mockResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

const sampleEndpoint: EndpointInfo = {
  id: "ep_1",
  url: "/v1/ai/summarize",
  method: "POST",
  description: "Summarize text",
  category: "ai",
  price_usdc: "0.01",
  active: true,
};

const sampleDiscover: DiscoverResult = {
  endpoints: [sampleEndpoint],
  total: 1,
};

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

describe("AgentGateClient", () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let client: AgentGateClient;

  beforeEach(() => {
    mockFetch = vi.fn();
    client = new AgentGateClient({
      apiUrl: "https://api.test.com",
      fulfillUrl: "https://fulfill.test.com",
      fetch: mockFetch as unknown as typeof fetch,
    });
  });

  /* ---------- discover ---------- */

  it("discover() with no params returns endpoints", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(sampleDiscover));

    const result = await client.discover();

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.test.com/v1/discover",
      expect.objectContaining({ method: "GET" }),
    );
    expect(result.endpoints).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it("discover() with query filters results", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(sampleDiscover));

    await client.discover("summarize");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.test.com/v1/discover?q=summarize",
      expect.any(Object),
    );
  });

  it("discover() with category option", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(sampleDiscover));

    await client.discover(undefined, { category: "ai", limit: 5 });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("category=ai");
    expect(calledUrl).toContain("limit=5");
  });

  /* ---------- categories ---------- */

  it("categories() returns category list", async () => {
    const catResult: CategoryResult = {
      categories: [
        { category: "ai", count: 10 },
        { category: "data", count: 5 },
      ],
    };
    mockFetch.mockResolvedValueOnce(mockResponse(catResult));

    const result = await client.categories();

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.test.com/v1/discover/categories",
      expect.objectContaining({ method: "GET" }),
    );
    expect(result.categories).toHaveLength(2);
    expect(result.categories[0].category).toBe("ai");
  });

  /* ---------- call ---------- */

  it("call() with 200 response returns data", async () => {
    const responseData = { summary: "Hello world" };
    mockFetch.mockResolvedValueOnce(mockResponse(responseData));

    const result = await client.call("/v1/ai/summarize", { text: "test" });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://fulfill.test.com/v1/ai/summarize",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ text: "test" }),
      }),
    );
    expect(result.status).toBe(200);
    expect(result.data).toEqual(responseData);
  });

  it("call() with 402 response returns paymentRequired info", async () => {
    const paymentBody = {
      price: "0.01",
      network: "base",
      payTo: "0xABC",
      scheme: "x402",
    };
    mockFetch.mockResolvedValueOnce(mockResponse(paymentBody, { status: 402 }));

    const result = await client.call("/v1/ai/summarize", { text: "test" });

    expect(result.status).toBe(402);
    expect(result.paymentRequired).toEqual({
      price: "0.01",
      network: "base",
      payTo: "0xABC",
      scheme: "x402",
    });
    expect(result.data).toBeUndefined();
  });

  it("call() with payment header succeeds", async () => {
    const responseData = { result: "ok" };
    mockFetch.mockResolvedValueOnce(mockResponse(responseData));

    const result = await client.call("/v1/ai/summarize", { text: "test" }, {
      paymentHeader: "x402-payment-token",
    });

    const calledInit = mockFetch.mock.calls[0][1] as RequestInit;
    expect((calledInit.headers as Record<string, string>)["X-PAYMENT"]).toBe(
      "x402-payment-token",
    );
    expect(result.status).toBe(200);
    expect(result.data).toEqual(responseData);
  });

  it("call() with timeout/error returns proper error", async () => {
    mockFetch.mockImplementationOnce(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          const signal = init.signal as AbortSignal;
          signal.addEventListener("abort", () => {
            const err = new DOMException("The operation was aborted.", "AbortError");
            reject(err);
          });
        }),
    );

    await expect(
      client.call("/v1/ai/summarize", {}, { timeout: 10 }),
    ).rejects.toThrow("call timed out after 10ms");
  });

  /* ---------- endpoint ---------- */

  it("endpoint() finds matching endpoint", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(sampleDiscover));

    const ep = await client.endpoint("/v1/ai/summarize");

    expect(ep).toEqual(sampleEndpoint);
  });

  it("endpoint() returns null for non-existent path", async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ endpoints: [], total: 0 }),
    );

    const ep = await client.endpoint("/v1/nope");
    expect(ep).toBeNull();
  });

  /* ---------- config ---------- */

  it("custom apiUrl configuration works", async () => {
    const customClient = new AgentGateClient({
      apiUrl: "https://custom.api.com",
      fetch: mockFetch as unknown as typeof fetch,
    });

    mockFetch.mockResolvedValueOnce(mockResponse(sampleDiscover));
    await customClient.discover();

    expect(mockFetch).toHaveBeenCalledWith(
      "https://custom.api.com/v1/discover",
      expect.any(Object),
    );
  });
});
