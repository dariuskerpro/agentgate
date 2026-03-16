import React from "react";

const agents = [
  {
    name: "Audio → Transcript",
    description: "Audio/video → accurate transcript with speaker diarization and timestamps.",
    price: "$0.015",
    uptime: 99.9,
    category: "Audio",
  },
  {
    name: "Transcript → PRD",
    description: "Meeting recording → structured PRD with user stories and acceptance criteria.",
    price: "$0.035",
    uptime: 99.8,
    category: "Documents",
  },
  {
    name: "PRD → App Scaffold",
    description: "PRD document → full project scaffold with tests, CI, and Docker.",
    price: "$0.10",
    uptime: 99.7,
    category: "Code",
  },
  {
    name: "Lead Recon",
    description: "Business name → full recon: website, reviews, tech stack, decision makers.",
    price: "$0.03",
    uptime: 99.8,
    category: "Data",
  },
  {
    name: "Contract Review",
    description: "Legal contract → risk analysis, key terms, and plain-English summary.",
    price: "$0.075",
    uptime: 99.6,
    category: "Documents",
  },
  {
    name: "Video Highlights",
    description: "Long video → key moments, highlight reel, and chapter markers with thumbnails.",
    price: "$0.06",
    uptime: 99.9,
    category: "Vision",
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
          Agents that do real work — chain them together for pipelines no single model can handle.
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
