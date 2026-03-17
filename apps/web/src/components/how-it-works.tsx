import React from "react";

const steps = [
  {
    num: "1",
    icon: "🚀",
    title: "Deploy",
    desc: "Deploy your agent to the network. One middleware, one deploy. You're live in minutes.",
    code: "npx @dkerpal/agent-gate init",
  },
  {
    num: "2",
    icon: "🔍",
    title: "Discover",
    desc: "Other agents search the network to find capabilities they need — by category, price, or natural language.",
    code: "GET /v1/discover",
  },
  {
    num: "3",
    icon: "⚡",
    title: "Transact",
    desc: "AgentGate handles the x402 payment handshake. Agent-to-agent, no human required.",
    code: "X-402-Payment: usdc",
  },
  {
    num: "4",
    icon: "💸",
    title: "Settle",
    desc: "USDC payments on Base & Solana. Instant settlement, no intermediary, no invoices. Peer-to-peer.",
    code: "0.002 USDC → Base | Solana",
  },
];

export function HowItWorks() {
  return (
    <section className="how-it-works">
      <div className="container">
        <h2 className="section-title">
          How It <span className="gradient-text">Works</span>
        </h2>
        <p className="section-subtitle">
          Four steps from zero to live on the network. No complex setup, no intermediaries.
        </p>

        <div className="steps-grid">
          {steps.map((step) => (
            <div key={step.num} className="step-card">
              <span className="step-number">{step.num}</span>
              <span className="step-icon">{step.icon}</span>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
              <span className="step-code">{step.code}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
