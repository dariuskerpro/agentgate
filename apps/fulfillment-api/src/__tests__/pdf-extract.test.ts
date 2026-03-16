import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { app } from "../index.js";

// Set env before imports
process.env.GOOGLE_AI_API_KEY = "test-gemini-key";

const MOCK_GEMINI_RESPONSE = {
  text: "This is a sample document with extracted text.",
  pages: [
    {
      page_number: 1,
      text: "This is a sample document with extracted text.",
    },
  ],
  tables: [
    {
      headers: ["Name", "Value"],
      rows: [["Item A", "100"], ["Item B", "200"]],
    },
  ],
  key_value_pairs: {
    "Invoice Number": "INV-001",
    "Date": "2025-01-15",
  },
};

const MOCK_SCHEMA_RESPONSE = {
  text: "Invoice document",
  pages: [{ page_number: 1, text: "Invoice document" }],
  invoice: {
    number: "INV-001",
    date: "2025-01-15",
    total: 300,
    items: [
      { name: "Item A", amount: 100 },
      { name: "Item B", amount: 200 },
    ],
  },
};

function makeGeminiApiResponse(content: unknown) {
  return {
    candidates: [
      {
        content: {
          parts: [{ text: JSON.stringify(content) }],
        },
      },
    ],
  };
}

function createPdfBlob(sizeBytes = 1024): File {
  // PDF magic bytes: %PDF-1.4
  const header = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
  const padding = new Uint8Array(Math.max(0, sizeBytes - header.length));
  const combined = new Uint8Array(header.length + padding.length);
  combined.set(header);
  combined.set(padding, header.length);
  return new File([combined], "document.pdf", { type: "application/pdf" });
}

function createNonPdfFile(): File {
  return new File(["hello world"], "readme.txt", { type: "text/plain" });
}

// Store the original fetch
const originalFetch = globalThis.fetch;
let mockFetch: ReturnType<typeof vi.fn>;

describe("POST /v1/pdf-extract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch = vi.fn();
    globalThis.fetch = mockFetch;
  });

  // Restore fetch after all tests
  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  it("returns extracted text, pages, and metadata for a valid PDF", async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify(makeGeminiApiResponse(MOCK_GEMINI_RESPONSE)), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const form = new FormData();
    form.append("file", createPdfBlob());

    const res = await app.request("/v1/pdf-extract", {
      method: "POST",
      body: form,
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.text).toBe(MOCK_GEMINI_RESPONSE.text);
    expect(json.pages).toEqual(MOCK_GEMINI_RESPONSE.pages);
    expect(json.tables).toEqual(MOCK_GEMINI_RESPONSE.tables);
    expect(json.key_value_pairs).toEqual(MOCK_GEMINI_RESPONSE.key_value_pairs);
    expect(json.metadata).toBeDefined();
    expect(json.metadata.page_count).toBe(1);
    expect(json.metadata.file_size).toBeGreaterThan(0);
    expect(json.metadata.extracted_at).toBeDefined();

    // Verify Gemini was called
    expect(mockFetch).toHaveBeenCalledOnce();
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("generativelanguage.googleapis.com");
    expect(url).toContain("gemini-2.5-flash");
  });

  it("returns structured output when schema is provided", async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify(makeGeminiApiResponse(MOCK_SCHEMA_RESPONSE)), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const schema = JSON.stringify({
      type: "object",
      properties: {
        invoice: {
          type: "object",
          properties: {
            number: { type: "string" },
            date: { type: "string" },
            total: { type: "number" },
            items: { type: "array" },
          },
        },
      },
    });

    const form = new FormData();
    form.append("file", createPdfBlob());
    form.append("schema", schema);

    const res = await app.request("/v1/pdf-extract", {
      method: "POST",
      body: form,
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.text).toBe("Invoice document");
    expect(json.invoice).toBeDefined();
    expect(json.invoice.number).toBe("INV-001");
    expect(json.metadata).toBeDefined();

    // Verify schema was included in the prompt
    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body);
    const textParts = body.contents[0].parts
      .filter((p: Record<string, unknown>) => p.text)
      .map((p: Record<string, unknown>) => p.text)
      .join("");
    expect(textParts).toContain("schema");
  });

  it("rejects request with missing file", async () => {
    const form = new FormData();

    const res = await app.request("/v1/pdf-extract", {
      method: "POST",
      body: form,
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("file");
  });

  it("rejects non-PDF file", async () => {
    const form = new FormData();
    form.append("file", createNonPdfFile());

    const res = await app.request("/v1/pdf-extract", {
      method: "POST",
      body: form,
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("PDF");
  });

  it("rejects oversized file (>10MB)", async () => {
    const oversized = createPdfBlob(11 * 1024 * 1024);

    const form = new FormData();
    form.append("file", oversized);

    const res = await app.request("/v1/pdf-extract", {
      method: "POST",
      body: form,
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("10MB");
  });

  it("handles Gemini API errors gracefully", async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ error: { message: "Quota exceeded" } }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const form = new FormData();
    form.append("file", createPdfBlob());

    const res = await app.request("/v1/pdf-extract", {
      method: "POST",
      body: form,
    });

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Failed to extract PDF content");
  });

  it("rejects invalid multipart request", async () => {
    const res = await app.request("/v1/pdf-extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file: "not a file" }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });
});
