import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { agentgate, parsePrice, type AgentGateConfig } from "../express.js";

// Helper to create mock Express req/res/next
function createMockReq(
  method: string,
  path: string,
  headers: Record<string, string> = {}
): Partial<Request> {
  return {
    method,
    path,
    headers: { ...headers },
    get(name: string) {
      return (headers as Record<string, string>)[name.toLowerCase()];
    },
  } as Partial<Request>;
}

function createMockRes(): Partial<Response> & {
  _status: number;
  _json: unknown;
  _headers: Record<string, string>;
} {
  const res: any = {
    _status: 200,
    _json: null,
    _headers: {},
    status(code: number) {
      res._status = code;
      return res;
    },
    json(data: unknown) {
      res._json = data;
      return res;
    },
    setHeader(name: string, value: string) {
      res._headers[name] = value;
      return res;
    },
    end() {
      return res;
    },
  };
  return res;
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

describe("agentgate express middleware", () => {
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
    it("returns 402 for configured routes when no payment header is present", () => {
      const middleware = agentgate(validConfig);
      const req = createMockReq("GET", "/api/weather");
      const res = createMockRes();
      const next = vi.fn();

      middleware(req as Request, res as unknown as Response, next as NextFunction);

      expect(res._status).toBe(402);
      expect(res._json).toMatchObject({
        error: expect.stringContaining("Payment Required"),
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("allows request through when valid payment header is present", () => {
      const middleware = agentgate(validConfig);
      const req = createMockReq("GET", "/api/weather", {
        "x-402-payment": "valid-payment-token",
      });
      const res = createMockRes();
      const next = vi.fn();

      middleware(req as Request, res as unknown as Response, next as NextFunction);

      expect(next).toHaveBeenCalled();
      expect(res._status).toBe(200); // unchanged
    });
  });

  describe("unconfigured routes", () => {
    it("passes through without payment requirement for unconfigured routes", () => {
      const middleware = agentgate(validConfig);
      const req = createMockReq("GET", "/api/health");
      const res = createMockRes();
      const next = vi.fn();

      middleware(req as Request, res as unknown as Response, next as NextFunction);

      expect(next).toHaveBeenCalled();
      expect(res._status).toBe(200); // unchanged default
    });

    it("passes through when method does not match configured route", () => {
      const middleware = agentgate(validConfig);
      // Config has "GET /api/weather" but we send POST
      const req = createMockReq("POST", "/api/weather");
      const res = createMockRes();
      const next = vi.fn();

      middleware(req as Request, res as unknown as Response, next as NextFunction);

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
      const req = createMockReq("GET", "/api/weather", {
        "x-402-payment": "valid-payment-token",
      });
      const res = createMockRes();
      const next = vi.fn();

      middleware(req as Request, res as unknown as Response, next as NextFunction);

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

      // Verify the body contains expected transaction data
      const callArgs = fetchSpy.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body).toMatchObject({
        route: "GET /api/weather",
        wallet: validConfig.wallet,
        price: 0.001,
      });
    });

    it("does not fire analytics when no marketplace config is set", async () => {
      const middleware = agentgate(validConfig); // no marketplace config
      const req = createMockReq("GET", "/api/weather", {
        "x-402-payment": "valid-payment-token",
      });
      const res = createMockRes();
      const next = vi.fn();

      middleware(req as Request, res as unknown as Response, next as NextFunction);

      await new Promise((r) => setTimeout(r, 10));

      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe("graceful failure", () => {
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
      const req = createMockReq("GET", "/api/weather", {
        "x-402-payment": "valid-payment-token",
      });
      const res = createMockRes();
      const next = vi.fn();

      middleware(req as Request, res as unknown as Response, next as NextFunction);

      // Should still call next even if analytics fails
      expect(next).toHaveBeenCalled();

      // Wait for async analytics to attempt and fail silently
      await new Promise((r) => setTimeout(r, 10));

      // No uncaught error — middleware handles the failure gracefully
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

  describe("price parsing", () => {
    it("parses dollar-prefixed string '$0.001' to number 0.001", () => {
      expect(parsePrice("$0.001")).toBe(0.001);
    });

    it("parses plain string '0.001' to number 0.001", () => {
      expect(parsePrice("0.001")).toBe(0.001);
    });

    it("parses '$1.50' to 1.5", () => {
      expect(parsePrice("$1.50")).toBe(1.5);
    });

    it("parses '0.00001' to 0.00001", () => {
      expect(parsePrice("0.00001")).toBe(0.00001);
    });

    it("throws on invalid price string", () => {
      expect(() => parsePrice("free")).toThrow(/invalid price/i);
    });

    it("throws on empty string", () => {
      expect(() => parsePrice("")).toThrow(/invalid price/i);
    });

    it("throws on negative price", () => {
      expect(() => parsePrice("-0.01")).toThrow(/invalid price/i);
    });
  });
});
