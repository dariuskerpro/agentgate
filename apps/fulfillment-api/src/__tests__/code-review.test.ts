import { describe, it, expect, vi, beforeEach } from "vitest";
import { app } from "../index.js";

const mockCreate = vi.fn();

vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: class MockAnthropic {
      messages = { create: mockCreate };
    },
  };
});

// Set env before imports use it
process.env.ANTHROPIC_API_KEY = "test-key";

const MOCK_REVIEW = {
  score: 7.5,
  summary: "Generally good code with some security concerns.",
  findings: [
    {
      severity: "high",
      category: "security",
      file: "auth.ts",
      line: 42,
      title: "SQL injection vulnerability",
      description: "User input is directly concatenated into SQL query.",
      suggestion: "Use parameterized queries.",
    },
  ],
  stats: { total_findings: 1, high: 1, medium: 0, low: 0 },
};

function mockClaudeResponse(content: unknown) {
  mockCreate.mockResolvedValue({
    content: [{ type: "text", text: JSON.stringify(content) }],
  });
}

describe("POST /v1/code-review", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a code review for string input", async () => {
    mockClaudeResponse(MOCK_REVIEW);

    const res = await app.request("/v1/code-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "const x = 1;" }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.score).toBe(7.5);
    expect(json.findings).toHaveLength(1);
    expect(json.stats.high).toBe(1);
    expect(mockCreate).toHaveBeenCalledOnce();
  });

  it("returns a code review for array input", async () => {
    mockClaudeResponse(MOCK_REVIEW);

    const res = await app.request("/v1/code-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: [{ filename: "index.ts", content: "const x = 1;" }],
        language: "typescript",
        focus: "security",
      }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.score).toBe(7.5);
  });

  it("rejects missing code field", async () => {
    const res = await app.request("/v1/code-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("code");
  });

  it("rejects invalid focus value", async () => {
    const res = await app.request("/v1/code-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "x", focus: "banana" }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("focus");
  });

  it("rejects oversized input", async () => {
    const bigCode = "x".repeat(100_001);
    const res = await app.request("/v1/code-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: bigCode }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("limit");
  });

  it("rejects invalid array items", async () => {
    const res = await app.request("/v1/code-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: [{ filename: "x" }] }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("content");
  });

  it("handles Claude API errors gracefully", async () => {
    mockCreate.mockRejectedValue(new Error("API rate limit"));

    const res = await app.request("/v1/code-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "const x = 1;" }),
    });

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Failed to process code review");
  });

  it("rejects invalid JSON body", async () => {
    const res = await app.request("/v1/code-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Invalid JSON");
  });
});
