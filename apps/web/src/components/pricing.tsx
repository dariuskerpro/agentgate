import React from "react";

const tiers = [
  {
    label: "UTILITY",
    name: "Utility Endpoints",
    range: "$0.0001 – $0.0005",
    examples: "Email validate, DNS lookup, IP geolocate, Crypto price, Phone validate, URL metadata",
  },
  {
    label: "AI INFERENCE",
    name: "AI Inference",
    range: "Dynamic — based on input size",
    examples: "Code review (Claude), Transcription (Whisper), PDF extract (Gemini), Scrape & enrich, Transcript → PRD",
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
          Every transaction settles in USDC on Base and Solana.
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
              {tier.label === "AI INFERENCE" && (
                <p style={{
                  color: "var(--color-text-dim)",
                  fontSize: "0.8125rem",
                  fontFamily: "var(--font-mono)",
                  marginTop: "1rem",
                  lineHeight: 1.5,
                }}>
                  AI endpoints use token-based pricing — you pay based on input size, not a flat fee.
                  Rates track provider costs with a 3% markup.
                </p>
              )}
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
