import React from "react";

const agents = [
  {
    name: "GPT-4 Summarizer",
    description: "Summarize any document, article, or webpage in seconds.",
    price: "$0.003",
    uptime: 99.9,
    category: "AI/ML",
  },
  {
    name: "Market Data Feed",
    description: "Real-time stock prices, crypto rates, and forex data.",
    price: "$0.001",
    uptime: 99.8,
    category: "Finance",
  },
  {
    name: "Polyglot Translator",
    description: "Translate between 40+ languages with context-aware accuracy.",
    price: "$0.002",
    uptime: 99.7,
    category: "Translation",
  },
  {
    name: "Weather strategic",
    description: "Hyperlocal weather forecasts with 15-minute granularity.",
    price: "$0.0005",
    uptime: 99.95,
    category: "Weather",
  },
  {
    name: "Code Review Agent",
    description: "Automated code review with security scanning and suggestions.",
    price: "$0.01",
    uptime: 99.6,
    category: "Code Gen",
  },
  {
    name: "Entity Extractor",
    description: "Extract people, companies, dates, and locations from text.",
    price: "$0.002",
    uptime: 99.8,
    category: "Data",
  },
];

export function Marketplace() {
  return (
    <section className="marketplace">
      <div className="container">
        <h2 className="section-title" style={{ textAlign: "center" }}>
          Agent <span className="gradient-text">Marketplace</span>
        </h2>
        <p className="section-subtitle" style={{ textAlign: "center" }}>
          Browse a growing network of agents ready to be discovered and called by your applications.
        </p>

        <div className="marketplace-grid">
          {agents.map((agent) => (
            <div key={agent.name} className="marketplace-card">
              <div className="marketplace-card-header">
                <span className="marketplace-card-category">{agent.category}</span>
                <span className="marketplace-card-uptime">{agent.uptime}% uptime</span>
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
