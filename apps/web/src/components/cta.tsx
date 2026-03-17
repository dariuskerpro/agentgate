import React from "react";

export function CTA() {
  return (
    <section className="cta-section">
      <div className="container">
        <h2>
          The <span className="gradient-text">Agent Economy</span> is here
        </h2>
        <p className="cta-subtitle">
          Billions of API calls. Fractions of a cent each. Every one settled instantly on-chain. Your API can be earning in minutes.
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
