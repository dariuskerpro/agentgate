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

process.env.ANTHROPIC_API_KEY = "test-key";

const MOCK_PRD = {
  title: "Widget Builder — Product Requirements",
  overview: "A tool for building widgets quickly.",
  goals: ["Enable non-technical users to create widgets"],
  non_goals: ["Support legacy widget formats"],
  user_stories: [
    {
      as_a: "product manager",
      i_want: "to create widgets via drag-and-drop",
      so_that: "I don't need engineering help for simple changes",
      acceptance_criteria: ["Drag-and-drop UI renders in <2s"],
      priority: "P0",
    },
  ],
  technical_requirements: ["React 18+", "REST API backend"],
  open_questions: ["Should we support mobile?"],
  timeline_estimate: "3-4 weeks",
};

function mockClaudeResponse(content: unknown) {
  mockCreate.mockResolvedValue({
    content: [{ type: "text", text: JSON.stringify(content) }],
  });
}

describe("POST /v1/transcript-to-prd", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("converts transcript to detailed PRD", async () => {
    mockClaudeResponse(MOCK_PRD);

    const res = await app.request("/v1/transcript-to-prd", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript: "We need a widget builder..." }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.title).toContain("Widget Builder");
    expect(json.user_stories).toHaveLength(1);
    expect(json.goals).toHaveLength(1);
    expect(mockCreate).toHaveBeenCalledOnce();
  });

  it("accepts lean template", async () => {
    mockClaudeResponse(MOCK_PRD);

    const res = await app.request("/v1/transcript-to-prd", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript: "Let's build something small.",
        template: "lean",
      }),
    });

    expect(res.status).toBe(200);
    // Verify the system prompt was the lean one
    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.system).toContain("concise");
  });

  it("accepts product_context", async () => {
    mockClaudeResponse(MOCK_PRD);

    const res = await app.request("/v1/transcript-to-prd", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript: "Meeting notes here.",
        product_context: "This is for our enterprise dashboard.",
      }),
    });

    expect(res.status).toBe(200);
    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.messages[0].content).toContain("enterprise dashboard");
  });

  it("rejects missing transcript", async () => {
    const res = await app.request("/v1/transcript-to-prd", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("transcript");
  });

  it("rejects invalid template", async () => {
    const res = await app.request("/v1/transcript-to-prd", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript: "notes",
        template: "fancy",
      }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("template");
  });

  it("rejects oversized transcript", async () => {
    const big = "x".repeat(100_001);
    const res = await app.request("/v1/transcript-to-prd", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript: big }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("limit");
  });

  it("handles Claude API errors gracefully", async () => {
    mockCreate.mockRejectedValue(new Error("Service unavailable"));

    const res = await app.request("/v1/transcript-to-prd", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript: "Some meeting notes." }),
    });

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Failed to process transcript-to-PRD conversion");
  });

  it("rejects invalid JSON body", async () => {
    const res = await app.request("/v1/transcript-to-prd", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not valid json",
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Invalid JSON");
  });
});

describe("GET /health", () => {
  it("returns ok", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("ok");
  });
});

describe("404 handler", () => {
  it("returns 404 for unknown routes", async () => {
    const res = await app.request("/unknown");
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Not found");
  });
});
