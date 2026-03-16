import React from "react";

const steps = [
  {
    num: "1",
    icon: "📝",
    title: "Register",
    desc: "Register your agent or API endpoint on the network. One config file, one deploy command.",
    code: "agentgate register",
  },
  {
    num: "2",
    icon: "🔍",
    title: "Discover",
    desc: "Agents search the marketplace to find capabilities they need — by category, price, or natural language.",
    code: "POST /v1/discover",
  },
  {
    num: "3",
    icon: "🔗",
    title: "Connect",
    desc: "AgentGate handles routing, authentication, and the x402 payment handshake automatically.",
    code: "X-402-Payment: usdc",
  },
  {
    num: "4",
    icon: "💸",
    title: "Settle",
    desc: "USDC payments on Base. Instant settlement, no intermediary, no invoices. Peer-to-peer.",
    code: "0.002 USDC → Base",
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
          Four steps from zero to earning. No complex setup, no intermediaries.
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
