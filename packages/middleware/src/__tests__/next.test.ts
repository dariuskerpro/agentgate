import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { withAgentGate } from "../next.js";
import type { RouteConfig } from "../types.js";

// ── Next.js App Router pattern ─────────────────────────────────────
// Route handlers are functions: (request: Request) => Response | Promise<Response>
// withAgentGate wraps them with payment protection.

interface WithAgentGateOptions extends RouteConfig {
  wallet: string;
  marketplace?: {
    apiKey: string;
    baseUrl?: string;
  };
  facilitator?: string;
  network?: string;
}

function createRequest(
  method: string,
  url: string,
  headers: Record<string, string> = {}
): Request {
  return new Request(url, {
    method,
    headers: new Headers(headers),
  });
}

const validOptions: WithAgentGateOptions = {
  wallet: "0x1234567890abcdef1234567890abcdef12345678",
  price: "$0.001",
  description: "Weather data",
  category: "data",
};

describe("withAgentGate next.js middleware", () => {
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
    it("returns 402 when no payment header is present", async () => {
      const handler = vi.fn().mockResolvedValue(
        Response.json({ temp: 72 })
      );
      const wrapped = withAgentGate(handler, validOptions);

      const req = createRequest("GET", "http://localhost:3000/api/weather");
      const res = await wrapped(req);

      expect(res.status).toBe(402);
      const body = await res.json();
      expect(body).toMatchObject({
        error: expect.stringContaining("Payment Required"),
        price: 0.001,
        currency: "USDC",
      });
      expect(handler).not.toHaveBeenCalled();
    });

    it("calls the original handler when payment header is present", async () => {
      const handler = vi.fn().mockResolvedValue(
        Response.json({ temp: 72 })
      );
      const wrapped = withAgentGate(handler, validOptions);

      const req = createRequest("GET", "http://localhost:3000/api/weather", {
        "x-402-payment": "valid-payment-token",
      });
      const res = await wrapped(req);

      expect(handler).toHaveBeenCalledWith(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ temp: 72 });
    });
  });

  describe("unprotected routes work normally", () => {
    it("handler response is passed through unchanged when payment is valid", async () => {
      const responseBody = { data: "scraped content", url: "https://example.com" };
      const handler = vi.fn().mockResolvedValue(
        Response.json(responseBody)
      );
      const wrapped = withAgentGate(handler, validOptions);

      const req = createRequest("POST", "http://localhost:3000/api/scrape", {
        "x-402-payment": "valid-token",
      });
      const res = await wrapped(req);

      const body = await res.json();
      expect(body).toEqual(responseBody);
    });
  });

  describe("analytics events", () => {
    it("fires async analytics POST on settled payment", async () => {
      const options: WithAgentGateOptions = {
        ...validOptions,
        marketplace: {
          apiKey: "ag_test_key",
          baseUrl: "https://api.agentgate.test",
        },
      };
      const handler = vi.fn().mockResolvedValue(
        Response.json({ temp: 72 })
      );
      const wrapped = withAgentGate(handler, options);

      const req = createRequest("GET", "http://localhost:3000/api/weather", {
        "x-402-payment": "valid-payment-token",
      });
      await wrapped(req);

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
        wallet: validOptions.wallet,
        price: 0.001,
      });
    });

    it("does not fire analytics when no marketplace config is set", async () => {
      const handler = vi.fn().mockResolvedValue(
        Response.json({ temp: 72 })
      );
      const wrapped = withAgentGate(handler, validOptions);

      const req = createRequest("GET", "http://localhost:3000/api/weather", {
        "x-402-payment": "valid-payment-token",
      });
      await wrapped(req);

      await new Promise((r) => setTimeout(r, 10));
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("still returns handler response when marketplace API is unreachable", async () => {
      fetchSpy.mockRejectedValue(new Error("Network error"));

      const options: WithAgentGateOptions = {
        ...validOptions,
        marketplace: {
          apiKey: "ag_test_key",
          baseUrl: "https://api.agentgate.test",
        },
      };
      const handler = vi.fn().mockResolvedValue(
        Response.json({ temp: 72 })
      );
      const wrapped = withAgentGate(handler, options);

      const req = createRequest("GET", "http://localhost:3000/api/weather", {
        "x-402-payment": "valid-payment-token",
      });
      const res = await wrapped(req);

      expect(res.status).toBe(200);
      expect(handler).toHaveBeenCalled();

      await new Promise((r) => setTimeout(r, 10));
      expect(fetchSpy).toHaveBeenCalled();
    });
  });

  describe("configuration validation", () => {
    it("throws when wallet is missing", () => {
      const handler = vi.fn();
      expect(() =>
        withAgentGate(handler, { wallet: "", price: "$0.01" })
      ).toThrow(/wallet/i);
    });

    it("throws when price is invalid", () => {
      const handler = vi.fn();
      expect(() =>
        withAgentGate(handler, {
          wallet: "0x1234567890abcdef1234567890abcdef12345678",
          price: "free",
        })
      ).toThrow(/invalid price/i);
    });

    it("throws when price is missing", () => {
      const handler = vi.fn();
      expect(() =>
        withAgentGate(handler, {
          wallet: "0x1234567890abcdef1234567890abcdef12345678",
          price: "",
        })
      ).toThrow(/invalid price/i);
    });
  });

  describe("Next.js App Router compatibility", () => {
    it("returns a function that accepts Request and returns Promise<Response>", () => {
      const handler = vi.fn().mockResolvedValue(Response.json({}));
      const wrapped = withAgentGate(handler, validOptions);

      expect(typeof wrapped).toBe("function");
    });

    it("works with async handler functions", async () => {
      const handler = async (req: Request) => {
        // Simulate async work
        await new Promise((r) => setTimeout(r, 5));
        return Response.json({ async: true });
      };
      const wrapped = withAgentGate(handler, validOptions);

      const req = createRequest("GET", "http://localhost:3000/api/test", {
        "x-402-payment": "valid-token",
      });
      const res = await wrapped(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ async: true });
    });
  });
});
