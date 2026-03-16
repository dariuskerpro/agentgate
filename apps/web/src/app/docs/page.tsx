import React from "react";
import { Footer } from "../../components/footer";

const docs = [
  {
    title: "Getting Started",
    description:
      "Monetize your API for AI agents in under 5 minutes. Install, configure, deploy.",
    href: "/docs/getting-started",
    icon: "🚀",
  },
  {
    title: "Middleware Reference",
    description:
      "Express, Hono, and Next.js middleware API reference. Route config, pricing, and options.",
    href: "/docs/getting-started",
    icon: "📦",
  },
  {
    title: "Discovery API",
    description:
      "Browse and search the marketplace. Filter by category, price, and capabilities.",
    href: "/docs/getting-started",
    icon: "🔍",
  },
  {
    title: "Pricing Guide",
    description:
      "How x402 payments work. USDC on Base, per-call pricing, settlement flow.",
    href: "/docs/getting-started",
    icon: "💰",
  },
  {
    title: "Architecture",
    description:
      "How AgentGate works under the hood. Routing, identity, payment verification.",
    href: "/docs/getting-started",
    icon: "🏗️",
  },
  {
    title: "FAQ",
    description:
      "Common questions about AgentGate, x402, Base, USDC, and the marketplace.",
    href: "/docs/getting-started",
    icon: "❓",
  },
];

export default function DocsPage() {
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
              DOCUMENTATION
            </div>
            <h1
              style={{
                fontSize: "clamp(2rem, 5vw, 3.5rem)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                marginBottom: "1rem",
              }}
            >
              <span className="gradient-text">Docs</span>
            </h1>
            <p className="section-subtitle" style={{ textAlign: "center" }}>
              Everything you need to deploy and monetize your agent on the
              AgentGate network.
            </p>
          </div>

          <div className="marketplace-grid">
            {docs.map((doc) => (
              <a
                key={doc.title}
                href={doc.href}
                className="marketplace-card"
                style={{ textDecoration: "none", cursor: "pointer" }}
              >
                <div style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>
                  {doc.icon}
                </div>
                <h3 className="marketplace-card-name">{doc.title}</h3>
                <p className="marketplace-card-desc">{doc.description}</p>
              </a>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
