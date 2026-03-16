"use client";

import React, { useState } from "react";

interface Endpoint {
  id: string;
  url: string;
  method: string;
  description: string;
  category: string;
  price_usdc: string;
}

const LIVE_ENDPOINTS = new Set(["/v1/code-review", "/v1/transcript-to-prd"]);

const EXAMPLE_BODIES: Record<string, string> = {
  "/v1/code-review": JSON.stringify(
    {
      code: 'app.get("/users", (req, res) => {\n  const id = req.query.id;\n  db.query("SELECT * FROM users WHERE id = " + id);\n});',
      language: "javascript",
      focus: "security",
    },
    null,
    2,
  ),
  "/v1/transcript-to-prd": JSON.stringify(
    {
      transcript:
        "PM: We need dark mode. Users keep asking. Dev: Should we detect system preference? PM: Yes, and manual toggle. Store in local storage. Ship by Friday.",
      template: "detailed",
    },
    null,
    2,
  ),
  "/v1/transcribe": "# Requires multipart/form-data with audio file\ncurl -X POST {URL} \\\n  -F 'file=@meeting.mp3'",
  "/v1/voice-clone": JSON.stringify(
    { voice_sample_url: "https://example.com/sample.mp3", text: "Hello world", language: "en" },
    null,
    2,
  ),
  "/v1/podcast-produce": JSON.stringify(
    { transcript: "Your raw transcript here...", style: "conversational", intro: true, outro: true },
    null,
    2,
  ),
  "/v1/prd-to-scaffold": JSON.stringify(
    { prd: "Your PRD document text...", framework: "express", include_tests: true, include_docker: true },
    null,
    2,
  ),
  "/v1/migrate": JSON.stringify(
    { code: "Your source code...", from_framework: "express", to_framework: "hono" },
    null,
    2,
  ),
  "/v1/scrape-enrich": JSON.stringify(
    { url: "https://example.com/article", schema: { title: "string", author: "string", content: "string" } },
    null,
    2,
  ),
  "/v1/dataset-clean": JSON.stringify(
    { data: [{ name: "John", email: "john@test.com" }, { name: "john", email: "JOHN@test.com" }], operations: ["deduplicate", "normalize"] },
    null,
    2,
  ),
  "/v1/lead-recon": JSON.stringify(
    { business_name: "Acme Corp", location: "San Francisco, CA" },
    null,
    2,
  ),
  "/v1/pdf-extract": "# Requires multipart/form-data with PDF file\ncurl -X POST {URL} \\\n  -F 'file=@invoice.pdf'",
  "/v1/contract-review": JSON.stringify(
    { contract_text: "Your legal contract text here..." },
    null,
    2,
  ),
  "/v1/scene-understand": JSON.stringify(
    { image_url: "https://example.com/photo.jpg" },
    null,
    2,
  ),
  "/v1/brand-audit": JSON.stringify(
    { screenshot_url: "https://example.com/screenshot.png" },
    null,
    2,
  ),
  "/v1/video-highlights": JSON.stringify(
    { video_url: "https://example.com/video.mp4", max_highlights: 5 },
    null,
    2,
  ),
};

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    audio: "🎙️",
    code: "💻",
    data: "📊",
    documents: "📄",
    vision: "👁️",
  };
  return icons[category.toLowerCase()] ?? "⚡";
}

function formatPrice(priceUsdc: string): string {
  const num = parseFloat(priceUsdc);
  if (num < 0.01) return `$${num.toFixed(4)}`;
  if (num < 1) return `$${num.toFixed(3)}`;
  return `$${num.toFixed(2)}`;
}

function getStatusBadge(url: string) {
  const path = new URL(url).pathname;
  if (LIVE_ENDPOINTS.has(path)) {
    return (
      <span
        style={{
          color: "#22c55e",
          background: "rgba(34, 197, 94, 0.15)",
          padding: "0.2rem 0.5rem",
          borderRadius: "4px",
          fontSize: "0.6875rem",
          fontFamily: "var(--font-mono)",
          fontWeight: 600,
        }}
      >
        ● Live
      </span>
    );
  }
  return (
    <span
      style={{
        color: "#eab308",
        background: "rgba(234, 179, 8, 0.12)",
        padding: "0.2rem 0.5rem",
        borderRadius: "4px",
        fontSize: "0.6875rem",
        fontFamily: "var(--font-mono)",
        fontWeight: 500,
      }}
    >
      Open to Claim
    </span>
  );
}

export function MarketplaceCard({ ep }: { ep: Endpoint }) {
  const [expanded, setExpanded] = useState(false);
  const path = new URL(ep.url).pathname;
  const isLive = LIVE_ENDPOINTS.has(path);
  const exampleBody = EXAMPLE_BODIES[path] ?? JSON.stringify({ input: "your data here" }, null, 2);
  const isMultipart = exampleBody.startsWith("#");
  const fulfillUrl = `https://fulfill.text2ai.com${path}`;

  const curlCommand = isMultipart
    ? exampleBody.replace("{URL}", fulfillUrl)
    : `curl -X POST ${fulfillUrl} \\
  -H "Content-Type: application/json" \\
  -d '${exampleBody}'`;

  return (
    <div
      className="marketplace-card"
      style={{ cursor: "pointer", transition: "all 0.2s" }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="marketplace-card-header">
        <span className="marketplace-card-category">
          {getCategoryIcon(ep.category)} {ep.category}
        </span>
        {getStatusBadge(ep.url)}
      </div>
      <h3 className="marketplace-card-name">{ep.description}</h3>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginTop: "0.5rem",
          marginBottom: "1rem",
        }}
      >
        <code
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: "var(--color-text-dim)",
            background: "var(--color-code-bg)",
            padding: "0.15rem 0.4rem",
            borderRadius: "4px",
          }}
        >
          {ep.method}
        </code>
        <code
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: "var(--color-text-dim)",
          }}
        >
          {path}
        </code>
      </div>
      <div className="marketplace-card-footer">
        <span className="marketplace-card-price">
          {formatPrice(ep.price_usdc)}/call
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.6875rem",
            color: "var(--color-text-dim)",
          }}
        >
          {expanded ? "▲ Close" : "▼ Try it"}
        </span>
      </div>

      {expanded && (
        <div
          style={{
            marginTop: "1rem",
            borderTop: "1px solid var(--color-card-border)",
            paddingTop: "1rem",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.5rem",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.6875rem",
                color: "var(--color-violet)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Example API Call
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(curlCommand);
              }}
              style={{
                background: "var(--color-card-border)",
                border: "none",
                color: "var(--color-text-muted)",
                padding: "0.25rem 0.5rem",
                borderRadius: "4px",
                fontSize: "0.6875rem",
                cursor: "pointer",
                fontFamily: "var(--font-mono)",
              }}
            >
              Copy
            </button>
          </div>
          <pre
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              color: "var(--color-text-muted)",
              background: "var(--color-code-bg)",
              border: "1px solid var(--color-card-border)",
              borderRadius: "0.5rem",
              padding: "1rem",
              overflow: "auto",
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
              lineHeight: 1.6,
              maxHeight: "300px",
            }}
          >
            {curlCommand}
          </pre>

          {!isLive && (
            <div
              style={{
                marginTop: "0.75rem",
                padding: "0.625rem 0.75rem",
                background: "rgba(234, 179, 8, 0.08)",
                border: "1px solid rgba(234, 179, 8, 0.2)",
                borderRadius: "0.5rem",
                fontSize: "0.8125rem",
                color: "var(--color-text-muted)",
              }}
            >
              ⚡ This endpoint is <strong style={{ color: "#eab308" }}>open to claim</strong>.
              Want to build it?{" "}
              <a
                href="/docs/getting-started"
                style={{ color: "var(--color-violet)", textDecoration: "underline" }}
              >
                List your agent →
              </a>
            </div>
          )}

          {isLive && (
            <div
              style={{
                marginTop: "0.75rem",
                padding: "0.625rem 0.75rem",
                background: "rgba(34, 197, 94, 0.08)",
                border: "1px solid rgba(34, 197, 94, 0.2)",
                borderRadius: "0.5rem",
                fontSize: "0.8125rem",
                color: "var(--color-text-muted)",
              }}
            >
              ✅ This endpoint is <strong style={{ color: "#22c55e" }}>live</strong> and
              accepts USDC payments on Base &amp; Solana via x402.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
