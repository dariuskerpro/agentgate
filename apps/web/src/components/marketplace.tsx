import React from "react";

const agents = [
  {
    name: "Audio → Transcript",
    description: "Audio/video → accurate transcript with speaker diarization and timestamps.",
    price: "$0.015",
    category: "Audio",
  },
  {
    name: "Code Review",
    description: "Source code → detailed review with suggestions, bugs, and improvements.",
    price: "$0.05",
    category: "Code",
  },
  {
    name: "Transcript → PRD",
    description: "Meeting recording → structured PRD with user stories and acceptance criteria.",
    price: "$0.035",
    category: "Documents",
  },
  {
    name: "Scrape & Enrich",
    description: "URL → structured data extraction with custom schema mapping.",
    price: "$0.012",
    category: "Data",
  },
  {
    name: "PDF Extract",
    description: "PDF file → structured text, tables, and metadata extraction.",
    price: "$0.02",
    category: "Documents",
  },
  {
    name: "Email Validate",
    description: "Email address → deliverability check, MX validation, and risk score.",
    price: "$0.0005",
    category: "Data",
  },
  {
    name: "DNS Lookup",
    description: "Domain → DNS records (A, MX, NS, TXT) with full resolution.",
    price: "$0.0003",
    category: "Data",
  },
  {
    name: "URL Metadata",
    description: "URL → title, description, Open Graph, and social metadata.",
    price: "$0.0005",
    category: "Data",
  },
  {
    name: "Phone Validate",
    description: "Phone number → carrier, type, country, and validity check.",
    price: "$0.0003",
    category: "Data",
  },
  {
    name: "Crypto Price",
    description: "Coin IDs → real-time prices, market cap, and 24h change.",
    price: "$0.0001",
    category: "Data",
  },
  {
    name: "IP Geolocate",
    description: "IP address → city, country, ISP, and coordinates.",
    price: "$0.0002",
    category: "Data",
  },
];

export function Marketplace() {
  return (
    <section className="marketplace">
      <div className="container">
        <h2 className="section-title" style={{ textAlign: "center" }}>
          Live <span className="gradient-text">Endpoints</span>
        </h2>
        <p className="section-subtitle" style={{ textAlign: "center" }}>
          11 endpoints live today — all accepting USDC payments via x402.
        </p>

        <div className="marketplace-grid">
          {agents.map((agent) => (
            <div key={agent.name} className="marketplace-card">
              <div className="marketplace-card-header">
                <span className="marketplace-card-category">{agent.category}</span>
                <span style={{
                  color: "#22c55e",
                  background: "rgba(34, 197, 94, 0.15)",
                  padding: "0.2rem 0.5rem",
                  borderRadius: "4px",
                  fontSize: "0.6875rem",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                }}>● Live</span>
              </div>
              <h3 className="marketplace-card-name">{agent.name}</h3>
              <p className="marketplace-card-desc">{agent.description}</p>
              <div className="marketplace-card-footer">
                <span className="marketplace-card-price">{agent.price}/call</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
          <a href="/marketplace" className="btn-secondary">
            Browse Marketplace →
          </a>
        </div>
      </div>
    </section>
  );
}
