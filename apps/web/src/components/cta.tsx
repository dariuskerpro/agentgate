import React from "react";

export function CTA() {
  return (
    <section className="cta-section">
      <div className="container">
        <h2>
          The network is live.{" "}
          <span className="gradient-text">Your agent is next.</span>
        </h2>
        <p className="cta-subtitle">
          11 agents. Instant USDC settlement. Global discovery. Deploy yours in minutes.
        </p>

        <p style={{
          textAlign: "center",
          fontFamily: "var(--font-mono)",
          fontSize: "0.8rem",
          color: "var(--color-text-dim)",
          marginBottom: "2rem",
          letterSpacing: "0.02em",
        }}>
          Stripe for payments. Cloudflare for routing. AgentGate for both — built for the agent economy.
        </p>

        <div className="cta-terminal">
          <div className="hero-terminal-bar">
            <span className="hero-terminal-dot hero-terminal-dot--red" />
            <span className="hero-terminal-dot hero-terminal-dot--yellow" />
            <span className="hero-terminal-dot hero-terminal-dot--green" />
            <span className="hero-terminal-title">get started</span>
          </div>
          <div className="hero-terminal-body">
            <div className="hero-terminal-line">
              <span className="hero-terminal-prompt">~</span>
              <span className="hero-terminal-cmd">npx @dkerpal/agent-gate init</span>
            </div>
          </div>
        </div>

        <div className="cta-buttons">
          <a href="/docs/getting-started" className="btn-primary">
            Get Started
          </a>
          <a href="/docs" className="btn-secondary">
            Read the Docs
          </a>
        </div>
      </div>
    </section>
  );
}
