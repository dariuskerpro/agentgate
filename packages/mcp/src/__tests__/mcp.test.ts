import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  TOOL_DEFINITIONS,
  handleDiscover,
  handleCall,
  handleCategories,
  handleToolCall,
} from "../tools.js";

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

describe("Tool definitions", () => {
  it("has 3 tools defined", () => {
    expect(TOOL_DEFINITIONS).toHaveLength(3);
  });

  it("defines agentgate_discover with correct schema", () => {
    const tool = TOOL_DEFINITIONS.find((t) => t.name === "agentgate_discover");
    expect(tool).toBeDefined();
    expect(tool!.description).toContain("Search AgentGate marketplace");
    expect(tool!.inputSchema.properties).toHaveProperty("query");
    expect(tool!.inputSchema.properties).toHaveProperty("category");
    expect(tool!.inputSchema.properties).toHaveProperty("limit");
  });

  it("defines agentgate_call with correct schema", () => {
    const tool = TOOL_DEFINITIONS.find((t) => t.name === "agentgate_call");
    expect(tool).toBeDefined();
    expect(tool!.description).toContain("Call an AgentGate endpoint");
    expect(tool!.inputSchema.properties).toHaveProperty("endpoint");
    expect(tool!.inputSchema.properties).toHaveProperty("data");
    expect(tool!.inputSchema.properties).toHaveProperty("network");
  });

  it("defines agentgate_categories with correct schema", () => {
    const tool = TOOL_DEFINITIONS.find(
      (t) => t.name === "agentgate_categories",
    );
    expect(tool).toBeDefined();
    expect(tool!.description).toContain("List all available endpoint categories");
  });
});

describe("handleDiscover", () => {
  it("calls the discover API and returns formatted results", async () => {
    const mockData = [
      {
        url: "https://api.agentgate.online/v1/chat",
        description: "Chat completion",
        price: "0.001",
        category: "llm",
      },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await handleDiscover({ query: "chat" });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain("/v1/discover");
    expect(calledUrl).toContain("query=chat");
    expect(result.content[0].type).toBe("text");
    expect(JSON.parse(result.content[0].text)).toEqual(mockData);
  });

  it("passes category and limit as query params", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    await handleDiscover({ category: "llm", limit: 5 });

    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain("category=llm");
    expect(calledUrl).toContain("limit=5");
  });

  it("throws on API error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    await expect(handleDiscover({})).rejects.toThrow("AgentGate API error: 500");
  });
});

describe("handleCategories", () => {
  it("calls the categories API and returns results", async () => {
    const mockData = ["llm", "image", "audio", "search"];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const result = await handleCategories();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain("/v1/discover/categories");
    expect(JSON.parse(result.content[0].text)).toEqual(mockData);
  });

  it("throws on API error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
    });

    await expect(handleCategories()).rejects.toThrow("AgentGate API error: 503");
  });
});

describe("handleCall", () => {
  it("handles 402 responses and returns payment info", async () => {
    const headers = new Map([
      ["x-payment-address", "0xabc123"],
      ["x-payment-amount", "1000000"],
      ["x-payment-currency", "USDC"],
      ["x-payment-network", "base"],
    ]);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 402,
      headers: {
        get: (key: string) => headers.get(key) || null,
      },
      json: async () => ({ error: "Payment required" }),
    });

    const result = await handleCall({
      endpoint: "https://api.example.com/v1/chat",
      data: { prompt: "hello" },
    });

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.status).toBe(402);
    expect(parsed.message).toContain("Payment required");
    expect(parsed.paymentHeaders["x-payment-address"]).toBe("0xabc123");
    expect(parsed.paymentHeaders["x-payment-amount"]).toBe("1000000");
    expect(parsed.network).toBe("base");
  });

  it("handles successful 200 responses", async () => {
    const responseData = { result: "Hello world!" };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => responseData,
    });

    const result = await handleCall({
      endpoint: "https://api.example.com/v1/chat",
      data: { prompt: "hello" },
    });

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed).toEqual(responseData);
  });

  it("passes network parameter through on 402", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 402,
      headers: { get: () => null },
      json: async () => ({}),
    });

    const result = await handleCall({
      endpoint: "https://api.example.com/v1/chat",
      data: {},
      network: "solana",
    });

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.network).toBe("solana");
  });

  it("throws on non-402 error responses", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    await expect(
      handleCall({
        endpoint: "https://api.example.com/v1/chat",
        data: {},
      }),
    ).rejects.toThrow("Endpoint error: 500");
  });
});

describe("handleToolCall", () => {
  it("routes to correct handler", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    await handleToolCall("agentgate_categories", {});
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("throws on unknown tool", async () => {
    await expect(handleToolCall("unknown_tool", {})).rejects.toThrow(
      "Unknown tool: unknown_tool",
    );
  });
});
