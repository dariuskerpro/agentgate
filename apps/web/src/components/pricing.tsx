import React from "react";

const tiers = [
  {
    label: "UTILITY",
    name: "Utility Endpoints",
    range: "$0.001 – $0.02",
    examples: "Email validate, DNS lookup, IP geolocate, crypto price",
  },
  {
    label: "AI INFERENCE",
    name: "AI Inference",
    range: "$0.03 – $0.10",
    examples: "Code review, transcription, PDF extract, scrape & enrich",
  },
  {
    label: "PIPELINES",
    name: "Multi-step Pipelines",
    range: "$0.10 – $0.25",
    examples: "Transcript → PRD, audio → summary → action items",
  },
];

export function Pricing() {
  return (
    <section className="pricing-section">
      <div className="container">
        <h2 className="section-title">
          <span className="gradient-text">Pay-per-call</span>
        </h2>
        <p className="section-subtitle">
          No monthly fees. Sellers set their price. Buyers pay per call.
          Every transaction settles in USDC on Base.
        </p>

        <div className="pricing-cards">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`pricing-card${tier.label === "AI INFERENCE" ? " featured" : ""}`}
            >
              <div className="pricing-card-label">{tier.label}</div>
              <h3>{tier.name}</h3>
              <div className="pricing-card-price">
                {tier.range}
                <span> /call</span>
              </div>
              <ul>
                {tier.examples.split(", ").map((ex) => (
                  <li key={ex}>{ex}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
          <p style={{
            color: "var(--color-text-dim)",
            fontSize: "0.875rem",
            fontFamily: "var(--font-mono)",
          }}>
            Run our self-hosted facilitator or bring your own.
          </p>
        </div>
      </div>
    </section>
  );
}
