import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { app } from "../index.js";

// Sample HTML for mocking
const SAMPLE_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Test Page Title</title>
  <meta name="description" content="A test page description">
</head>
<body>
  <h1>Main Heading</h1>
  <h2>Sub Heading</h2>
  <p>This is paragraph text with some content.</p>
  <a href="https://example.com/link1">Link One</a>
  <a href="https://example.com/link2">Link Two</a>
</body>
</html>`;

const OPENAI_CHAT_RESPONSE = {
  choices: [
    {
      message: {
        content: JSON.stringify({
          name: "Test Product",
          price: "$9.99",
          category: "widgets",
        }),
      },
    },
  ],
};

const OPENAI_EMBEDDING_RESPONSE = {
  data: [{ embedding: [0.1, 0.2, 0.3, 0.4, 0.5] }],
};

// Store the original fetch
const originalFetch = globalThis.fetch;

describe("POST /v1/scrape-enrich", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch = vi.fn();
    globalThis.fetch = mockFetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  function mockUrlFetch(html: string = SAMPLE_HTML, status = 200) {
    mockFetch.mockImplementation((url: string | URL | Request) => {
      const urlStr = typeof url === "string" ? url : url instanceof URL ? url.href : url.url;

      // OpenAI API calls
      if (urlStr.includes("api.openai.com")) {
        if (urlStr.includes("/embeddings")) {
          return Promise.resolve(
            new Response(JSON.stringify(OPENAI_EMBEDDING_RESPONSE), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }
        if (urlStr.includes("/chat/completions")) {
          return Promise.resolve(
            new Response(JSON.stringify(OPENAI_CHAT_RESPONSE), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }
      }

      // URL scraping
      return Promise.resolve(
        new Response(html, {
          status,
          headers: { "Content-Type": "text/html" },
        }),
      );
    });
  }

  // 1. Successful scrape without schema
  it("returns extracted content without schema", async () => {
    mockUrlFetch();

    const res = await app.request("/v1/scrape-enrich", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://example.com/page" }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.url).toBe("https://example.com/page");
    expect(json.title).toBe("Test Page Title");
    expect(json.description).toBe("A test page description");
    expect(json.content).toBeDefined();
    expect(json.content.headings).toBeDefined();
    expect(json.content.links).toBeDefined();
    expect(json.content.text).toBeDefined();
    expect(json.metadata).toBeDefined();
    expect(json.metadata.fetched_at).toBeDefined();
    expect(json.metadata.content_length).toBeGreaterThan(0);
    expect(json.metadata.status_code).toBe(200);
    expect(json.embeddings).toBeUndefined();
  });

  // 2. Successful scrape with schema
  it("returns structured content via GPT-4.1 mini when schema provided", async () => {
    mockUrlFetch();
    process.env.OPENAI_API_KEY = "test-openai-key";

    const schema = {
      type: "object",
      properties: {
        name: { type: "string" },
        price: { type: "string" },
        category: { type: "string" },
      },
    };

    const res = await app.request("/v1/scrape-enrich", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://example.com/product", schema }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.content).toEqual({
      name: "Test Product",
      price: "$9.99",
      category: "widgets",
    });
    expect(json.metadata.status_code).toBe(200);

    // Verify OpenAI was called
    const openaiCall = mockFetch.mock.calls.find(
      (call: unknown[]) => typeof call[0] === "string" && (call[0] as string).includes("chat/completions"),
    );
    expect(openaiCall).toBeDefined();
  });

  // 3. Successful scrape with embeddings
  it("returns embeddings array when include_embeddings is true", async () => {
    mockUrlFetch();
    process.env.OPENAI_API_KEY = "test-openai-key";

    const res = await app.request("/v1/scrape-enrich", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: "https://example.com/page",
        include_embeddings: true,
      }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.embeddings).toEqual([0.1, 0.2, 0.3, 0.4, 0.5]);

    // Verify embeddings API was called
    const embeddingCall = mockFetch.mock.calls.find(
      (call: unknown[]) => typeof call[0] === "string" && (call[0] as string).includes("/embeddings"),
    );
    expect(embeddingCall).toBeDefined();
  });

  // 4. Rejects missing url
  it("rejects missing url", async () => {
    const res = await app.request("/v1/scrape-enrich", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("url");
  });

  // 5. Rejects invalid url
  it("rejects invalid url (not http/https)", async () => {
    const res = await app.request("/v1/scrape-enrich", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "ftp://example.com/file" }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("url");
  });

  // 6. Handles fetch timeout/errors gracefully
  it("returns 502 on fetch timeout/error", async () => {
    mockFetch.mockImplementation(() => {
      return Promise.reject(new TypeError("fetch failed"));
    });

    const res = await app.request("/v1/scrape-enrich", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://example.com/timeout" }),
    });

    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  // 7. Handles OpenAI API errors gracefully
  it("returns 500 on OpenAI API error", async () => {
    process.env.OPENAI_API_KEY = "test-openai-key";

    mockFetch.mockImplementation((url: string | URL | Request) => {
      const urlStr = typeof url === "string" ? url : url instanceof URL ? url.href : url.url;

      if (urlStr.includes("api.openai.com")) {
        return Promise.resolve(
          new Response(JSON.stringify({ error: { message: "Rate limit exceeded" } }), {
            status: 429,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }

      return Promise.resolve(
        new Response(SAMPLE_HTML, {
          status: 200,
          headers: { "Content-Type": "text/html" },
        }),
      );
    });

    const res = await app.request("/v1/scrape-enrich", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: "https://example.com/page",
        schema: { type: "object", properties: { name: { type: "string" } } },
      }),
    });

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  // 8. Rejects invalid JSON body
  it("rejects invalid JSON body", async () => {
    const res = await app.request("/v1/scrape-enrich", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Invalid JSON");
  });
});
