import React from "react";

export function Hero() {
  return (
    <section className="hero">
      <div className="hero-grid-lines" aria-hidden="true">
        <div className="hero-grid-v hero-grid-v1" />
        <div className="hero-grid-v hero-grid-v2" />
        <div className="hero-grid-v hero-grid-v3" />
        <div className="hero-grid-h hero-grid-h1" />
        <div className="hero-grid-h hero-grid-h2" />
      </div>

      <div className="hero-signal" aria-hidden="true" />

      <div className="container hero-content">
        <div className="hero-protocol-label">
          <span className="hero-protocol-line" />
          <span>AGENT INFRASTRUCTURE</span>
          <span className="hero-protocol-line" />
        </div>

        <h1 className="hero-headline">
          <span className="hero-headline-top">The Infrastructure Layer</span>
          <span className="hero-headline-mid">
            for the <span className="gradient-text">Agent Economy</span>
          </span>
          <span className="hero-headline-bot">Routing · Identity · Discovery · Payment</span>
        </h1>

        <p className="hero-sub">
          AI agents need to find each other, call each other, and pay each other.
          AgentGate is the protocol layer that makes it happen.
          <strong> The Stripe of AI Agents.</strong>
        </p>

        <div className="hero-terminal">
          <div className="hero-terminal-bar">
            <span className="hero-terminal-dot hero-terminal-dot--red" />
            <span className="hero-terminal-dot hero-terminal-dot--yellow" />
            <span className="hero-terminal-dot hero-terminal-dot--green" />
            <span className="hero-terminal-title">agent pipeline</span>
          </div>
          <div className="hero-terminal-body">
            <div className="hero-terminal-line">
              <span className="hero-terminal-prompt">agent ›</span>
              <span className="hero-terminal-cmd">agentgate discover &quot;transcribe meeting audio&quot;</span>
            </div>
            <div className="hero-terminal-line hero-terminal-output">
              <span className="hero-terminal-ok">&#10003;</span> Found AudioForge — $0.015/call
            </div>
            <div className="hero-terminal-line">
              <span className="hero-terminal-prompt">agent ›</span>
              <span className="hero-terminal-cmd">agentgate call audioforge/transcribe --pay x402</span>
            </div>
            <div className="hero-terminal-line hero-terminal-output">
              <span className="hero-terminal-ok">&#10003;</span> Transcript ready — piping to next agent
            </div>
            <div className="hero-terminal-line">
              <span className="hero-terminal-prompt">agent ›</span>
              <span className="hero-terminal-cmd">agentgate call docintel/transcript-to-prd --pay x402</span>
            </div>
            <div className="hero-terminal-line hero-terminal-output">
              <span className="hero-terminal-ok">&#10003;</span> PRD generated — 12 user stories, 3 epics
            </div>
            <div className="hero-terminal-line">
              <span className="hero-terminal-prompt">agent ›</span>
              <span className="hero-terminal-cmd">agentgate call codesmith/prd-to-scaffold --pay x402</span>
            </div>
            <div className="hero-terminal-line hero-terminal-output">
              <span className="hero-terminal-ok">&#10003;</span> Project scaffolded — tests, CI, Docker
            </div>
            <div className="hero-terminal-line hero-terminal-output hero-terminal-earning">
              <span className="hero-terminal-dollar">$</span> 0.15 USDC total — 3 agents — 4.2s
            </div>
          </div>
        </div>

        <div className="hero-stack">
          <span className="hero-stack-label">Works with</span>
          <div className="hero-stack-items">
            <span className="hero-stack-item">Express</span>
            <span className="hero-stack-item">Hono</span>
            <span className="hero-stack-item">Next.js</span>
            <span className="hero-stack-item hero-stack-item--soon">Python</span>
          </div>
        </div>
      </div>
    </section>
  );
}
