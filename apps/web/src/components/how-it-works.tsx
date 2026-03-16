import React from "react";

const steps = [
  { emoji: "📦", title: "Install", description: "Run npx agentgate init in your project" },
  { emoji: "⚙️", title: "Configure", description: "Set your wallet and price per endpoint" },
  { emoji: "💰", title: "Earn", description: "AI agents discover and pay for your API in USDC" },
];

export function HowItWorks() {
  return (
    <section style={{ padding: "4rem 2rem", textAlign: "center" }}>
      <h2 style={{ fontSize: "2rem", marginBottom: "2rem" }}>How It Works</h2>
      <div style={{ display: "flex", justifyContent: "center", gap: "3rem", flexWrap: "wrap" }}>
        {steps.map((step, i) => (
          <div key={i} style={{ maxWidth: "250px" }}>
            <div style={{ fontSize: "3rem" }}>{step.emoji}</div>
            <h3>{step.title}</h3>
            <p style={{ color: "#64748b" }}>{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
