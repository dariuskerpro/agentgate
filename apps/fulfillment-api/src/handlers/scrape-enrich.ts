import type { Context } from "hono";

const USER_AGENT = "AgentGate/1.0 (scrape-enrich)";
const FETCH_TIMEOUT = 10_000;
const MAX_CONTENT_SIZE = 500 * 1024; // 500KB
const OPENAI_API_URL = "https://api.openai.com/v1";

// ── helpers ──────────────────────────────────────────────────────────

function isValidUrl(raw: unknown): raw is string {
  if (typeof raw !== "string") return false;
  return /^https?:\/\//i.test(raw);
}

function stripHtmlTags(html: string): string {
  // Remove script and style blocks entirely
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  // Remove HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, "");
  // Replace block-level tags with newlines
  text = text.replace(/<\/?(?:div|p|br|hr|h[1-6]|li|tr|td|th|blockquote|pre|section|article|header|footer|nav|main|aside)[^>]*>/gi, "\n");
  // Strip remaining tags
  text = text.replace(/<[^>]+>/g, "");
  // Decode common entities
  text = text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
  // Collapse whitespace
  text = text.replace(/[ \t]+/g, " ").replace(/\n\s*\n/g, "\n").trim();
  return text;
}

function extractTitle(html: string): string | null {
  const m = /<title[^>]*>([^<]*)<\/title>/i.exec(html);
  return m ? m[1].trim() : null;
}

function extractDescription(html: string): string | null {
  const p1 = /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i;
  const p2 = /<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i;
  const m = p1.exec(html) ?? p2.exec(html);
  return m ? m[1].trim() : null;
}

function extractHeadings(html: string): string[] {
  const headings: string[] = [];
  const re = /<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const text = m[1].replace(/<[^>]+>/g, "").trim();
    if (text) headings.push(text);
  }
  return headings;
}

function extractLinks(html: string): Array<{ href: string; text: string }> {
  const links: Array<{ href: string; text: string }> = [];
  const re = /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const text = m[2].replace(/<[^>]+>/g, "").trim();
    links.push({ href: m[1], text });
  }
  return links;
}

async function callOpenAIChat(
  apiKey: string,
  systemPrompt: string,
  userContent: string,
): Promise<string> {
  const res = await fetch(`${OPENAI_API_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      temperature: 0,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI chat API error (${res.status}): ${err}`);
  }

  const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
  return data.choices[0].message.content;
}

async function callOpenAIEmbeddings(
  apiKey: string,
  text: string,
): Promise<number[]> {
  const res = await fetch(`${OPENAI_API_URL}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI embeddings API error (${res.status}): ${err}`);
  }

  const data = (await res.json()) as { data: Array<{ embedding: number[] }> };
  return data.data[0].embedding;
}

// ── handler ──────────────────────────────────────────────────────────

export async function handleScrapeEnrich(c: Context) {
  let body: { url?: unknown; schema?: unknown; include_embeddings?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const { url, schema, include_embeddings } = body;

  // Validate url
  if (!isValidUrl(url)) {
    return c.json(
      { error: "Missing or invalid url (must start with http:// or https://)" },
      400,
    );
  }

  // Validate schema
  if (schema !== undefined && (typeof schema !== "object" || schema === null || Array.isArray(schema))) {
    return c.json({ error: "schema must be an object if provided" }, 400);
  }

  // Validate include_embeddings
  if (include_embeddings !== undefined && typeof include_embeddings !== "boolean") {
    return c.json({ error: "include_embeddings must be a boolean if provided" }, 400);
  }

  // Fetch the URL
  let html: string;
  let statusCode: number;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    let response: Response;
    try {
      response = await fetch(url, {
        method: "GET",
        headers: { "User-Agent": USER_AGENT },
        signal: controller.signal,
        redirect: "follow",
      });
    } finally {
      clearTimeout(timer);
    }

    statusCode = response.status;

    // Read body with size limit
    const rawBody = await response.text();
    if (rawBody.length > MAX_CONTENT_SIZE) {
      return c.json(
        { error: `Content too large (${rawBody.length} bytes, max ${MAX_CONTENT_SIZE})` },
        413,
      );
    }
    html = rawBody;
  } catch (err: unknown) {
    const message =
      err instanceof DOMException && err.name === "AbortError"
        ? "Request timed out"
        : `Fetch failed: ${(err as Error).message}`;
    return c.json({ url, error: message }, 502);
  }

  // Extract basic metadata
  const title = extractTitle(html);
  const description = extractDescription(html);
  const plainText = stripHtmlTags(html);

  // Build content
  let content: unknown;
  const apiKey = process.env.OPENAI_API_KEY || "";

  try {
    if (schema) {
      // Use GPT-4.1 mini to structure content according to schema
      const systemPrompt = `You are a data extraction assistant. Extract structured data from the provided web page content according to the given JSON schema. Return ONLY valid JSON matching the schema, no explanation.`;
      const userContent = `Schema:\n${JSON.stringify(schema, null, 2)}\n\nWeb page content:\n${plainText.slice(0, 8000)}`;

      const structured = await callOpenAIChat(apiKey, systemPrompt, userContent);
      try {
        content = JSON.parse(structured);
      } catch {
        content = structured;
      }
    } else {
      // Default extraction
      content = {
        headings: extractHeadings(html),
        links: extractLinks(html),
        text: plainText.slice(0, 10000),
      };
    }
  } catch (err: unknown) {
    return c.json(
      { error: `Failed to process content: ${(err as Error).message}` },
      500,
    );
  }

  // Embeddings
  let embeddings: number[] | undefined;
  if (include_embeddings) {
    try {
      embeddings = await callOpenAIEmbeddings(apiKey, plainText.slice(0, 8000));
    } catch (err: unknown) {
      return c.json(
        { error: `Failed to generate embeddings: ${(err as Error).message}` },
        500,
      );
    }
  }

  const result: Record<string, unknown> = {
    url,
    title,
    description,
    content,
    metadata: {
      fetched_at: new Date().toISOString(),
      content_length: html.length,
      status_code: statusCode,
    },
  };

  if (embeddings) {
    result.embeddings = embeddings;
  }

  return c.json(result);
}
