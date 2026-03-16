import type { Context } from "hono";

const USER_AGENT = "AgentGate/1.0 (metadata extraction)";
const FETCH_TIMEOUT = 10_000;
const MAX_BODY = 50 * 1024; // 50KB — only need <head>

// ── helpers ──────────────────────────────────────────────────────────

function isValidUrl(raw: unknown): raw is string {
  if (typeof raw !== "string") return false;
  return /^https?:\/\//i.test(raw);
}

function first(html: string, pattern: RegExp): string | null {
  const m = pattern.exec(html);
  return m ? decodeEntities(m[1].trim()) : null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function metaContent(html: string, nameOrProp: string): string | null {
  // Match both name="..." and property="..." with content in either order
  const escaped = nameOrProp.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const p1 = new RegExp(
    `<meta[^>]*(?:name|property)=["']${escaped}["'][^>]*content=["']([^"']*)["']`,
    "i",
  );
  const p2 = new RegExp(
    `<meta[^>]*content=["']([^"']*)["'][^>]*(?:name|property)=["']${escaped}["']`,
    "i",
  );
  return first(html, p1) ?? first(html, p2);
}

function extractOg(html: string): Record<string, string> {
  const og: Record<string, string> = {};
  const re = /<meta[^>]*(?:property)=["']og:([^"']+)["'][^>]*content=["']([^"']*)["']|<meta[^>]*content=["']([^"']*)["'][^>]*(?:property)=["']og:([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const key = (m[1] ?? m[4]).toLowerCase();
    const val = decodeEntities((m[2] ?? m[3]).trim());
    if (val && !og[key]) og[key] = val;
  }
  return og;
}

function extractTwitter(html: string): Record<string, string> {
  const tw: Record<string, string> = {};
  const re = /<meta[^>]*(?:name|property)=["']twitter:([^"']+)["'][^>]*content=["']([^"']*)["']|<meta[^>]*content=["']([^"']*)["'][^>]*(?:name|property)=["']twitter:([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const key = (m[1] ?? m[4]).toLowerCase();
    const val = decodeEntities((m[2] ?? m[3]).trim());
    if (val && !tw[key]) tw[key] = val;
  }
  return tw;
}

function extractFaviconFromHtml(html: string): string | null {
  const re = /<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']+)["']/i;
  const alt = /<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:icon|shortcut icon)["']/i;
  return first(html, re) ?? first(html, alt);
}

function resolveUrl(base: string, relative: string): string {
  try {
    return new URL(relative, base).href;
  } catch {
    return relative;
  }
}

// ── handler ──────────────────────────────────────────────────────────

export async function handleUrlMetadata(c: Context) {
  let body: { url?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const { url } = body;
  if (!isValidUrl(url)) {
    return c.json({ error: "Missing or invalid URL (must start with http:// or https://)" }, 400);
  }

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

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("text/xhtml") && !contentType.includes("application/xhtml")) {
      return c.json({
        url,
        final_url: response.url || url,
        status_code: response.status,
        error: `Non-HTML content type: ${contentType}`,
        fetched_at: new Date().toISOString(),
      });
    }

    // Read only first 50KB
    const reader = response.body?.getReader();
    let html = "";
    if (reader) {
      const decoder = new TextDecoder();
      let bytes = 0;
      while (bytes < MAX_BODY) {
        const { done, value } = await reader.read();
        if (done) break;
        html += decoder.decode(value, { stream: true });
        bytes += value.byteLength;
      }
      reader.cancel().catch(() => {});
    }

    const finalUrl = response.url || url;
    const origin = new URL(finalUrl).origin;

    // Parse metadata
    const title = first(html, /<title[^>]*>([^<]*)<\/title>/i);
    const description = metaContent(html, "description");
    const og = extractOg(html);
    const twitter = extractTwitter(html);
    const language =
      first(html, /<html[^>]*\blang=["']([^"']+)["']/i) ?? null;
    const canonical =
      first(html, /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i) ??
      first(html, /<link[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["']/i) ??
      null;

    // Favicon
    let favicon = extractFaviconFromHtml(html);
    if (favicon) {
      favicon = resolveUrl(finalUrl, favicon);
    } else {
      // Fallback: check /favicon.ico
      try {
        const fc = new AbortController();
        const ft = setTimeout(() => fc.abort(), 3_000);
        try {
          const fRes = await fetch(`${origin}/favicon.ico`, {
            method: "HEAD",
            headers: { "User-Agent": USER_AGENT },
            signal: fc.signal,
            redirect: "follow",
          });
          if (fRes.ok) favicon = `${origin}/favicon.ico`;
        } finally {
          clearTimeout(ft);
        }
      } catch {
        // ignore
      }
    }

    return c.json({
      url,
      final_url: finalUrl,
      status_code: response.status,
      title: title ?? null,
      description: description ?? null,
      og: Object.keys(og).length ? og : null,
      twitter: Object.keys(twitter).length ? twitter : null,
      favicon: favicon ?? null,
      language: language ?? null,
      canonical: canonical ? resolveUrl(finalUrl, canonical) : null,
      fetched_at: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message =
      err instanceof DOMException && err.name === "AbortError"
        ? "Request timed out"
        : err instanceof TypeError
          ? `Connection failed: ${(err as Error).message}`
          : `Fetch error: ${(err as Error).message}`;

    return c.json({ url, error: message, fetched_at: new Date().toISOString() }, 502);
  }
}
