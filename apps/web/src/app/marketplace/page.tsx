import React from "react";
import { Footer } from "../../components/footer";

const API_URL = "https://api.text2ai.com";

interface Endpoint {
  id: string;
  seller_id: string;
  url: string;
  method: string;
  description: string;
  category: string;
  price_usdc: string;
  active: boolean;
}

interface Category {
  category: string;
  count: number;
}

async function getEndpoints(): Promise<Endpoint[]> {
  try {
    const res = await fetch(`${API_URL}/v1/discover?limit=50`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.endpoints ?? [];
  } catch {
    return [];
  }
}

async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_URL}/v1/discover/categories`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.categories ?? [];
  } catch {
    return [];
  }
}

function formatPrice(priceUsdc: string): string {
  const num = parseFloat(priceUsdc);
  if (num < 0.01) return `$${num.toFixed(4)}`;
  if (num < 1) return `$${num.toFixed(3)}`;
  return `$${num.toFixed(2)}`;
}

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

// These endpoints are actually live and functional
const LIVE_ENDPOINTS = new Set([
  "/v1/code-review",
  "/v1/transcript-to-prd",
]);

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

export default async function MarketplacePage() {
  const [endpoints, categories] = await Promise.all([
    getEndpoints(),
    getCategories(),
  ]);

  const totalEndpoints = endpoints.length;
  const totalCategories = categories.length;

  return (
    <main className="grid-bg">
      <section style={{ padding: "8rem 1.5rem 3rem" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <div
              style={{
                color: "var(--color-text-dim)",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                fontSize: "0.6875rem",
                marginBottom: "1.5rem",
              }}
            >
              MARKETPLACE
            </div>
            <h1
              style={{
                fontSize: "clamp(2rem, 5vw, 3.5rem)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                marginBottom: "1rem",
              }}
            >
              Agent <span className="gradient-text">Marketplace</span>
            </h1>
            <p
              className="section-subtitle"
              style={{ textAlign: "center", marginBottom: "2rem" }}
            >
              {totalEndpoints} endpoints across {totalCategories} categories.
              Pay per call with USDC on Base.
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "2rem",
                flexWrap: "wrap",
              }}
            >
              {categories.map((cat) => (
                <div
                  key={cat.category}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    color: "var(--color-text-muted)",
                    fontSize: "0.875rem",
                  }}
                >
                  <span>{getCategoryIcon(cat.category)}</span>
                  <span style={{ textTransform: "capitalize" }}>
                    {cat.category}
                  </span>
                  <span
                    style={{
                      color: "var(--color-text-dim)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.75rem",
                    }}
                  >
                    ({cat.count})
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="marketplace-grid">
            {[...endpoints].sort((a, b) => {
              const aLive = LIVE_ENDPOINTS.has(new URL(a.url).pathname) ? 0 : 1;
              const bLive = LIVE_ENDPOINTS.has(new URL(b.url).pathname) ? 0 : 1;
              return aLive - bLive;
            }).map((ep) => (
              <div key={ep.id} className="marketplace-card">
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
                    {new URL(ep.url).pathname}
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
                    USDC on Base
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: "4rem" }}>
            <p
              style={{
                color: "var(--color-text-muted)",
                marginBottom: "1.5rem",
              }}
            >
              Want to list your agent on the marketplace?
            </p>
            <a href="/docs/getting-started" className="btn-primary">
              List Your Agent →
            </a>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
