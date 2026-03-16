import React from "react";
import { Footer } from "../../components/footer";
import { MarketplaceCard } from "../../components/marketplace-card";

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

const LIVE_ENDPOINTS = new Set([
  "/v1/code-review",
  "/v1/transcript-to-prd",
  "/v1/email-validate",
  "/v1/dns-lookup",
  "/v1/url-metadata",
  "/v1/phone-validate",
  "/v1/crypto-price",
  "/v1/ip-geolocate",
]);

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

export default async function MarketplacePage() {
  const [endpoints, categories] = await Promise.all([
    getEndpoints(),
    getCategories(),
  ]);

  const totalEndpoints = endpoints.length;
  const totalCategories = categories.length;

  const sorted = [...endpoints].sort((a, b) => {
    const aLive = LIVE_ENDPOINTS.has(new URL(a.url).pathname) ? 0 : 1;
    const bLive = LIVE_ENDPOINTS.has(new URL(b.url).pathname) ? 0 : 1;
    return aLive - bLive;
  });

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
              style={{ textAlign: "center", marginBottom: "1rem" }}
            >
              {totalEndpoints} endpoints across {totalCategories} categories.
              Pay per call with USDC on Base &amp; Solana.
            </p>
            <p
              style={{
                color: "var(--color-text-dim)",
                fontSize: "0.875rem",
                marginBottom: "2rem",
              }}
            >
              Click any endpoint to see an example API call.
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
            {sorted.map((ep) => (
              <MarketplaceCard key={ep.id} ep={ep} />
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
