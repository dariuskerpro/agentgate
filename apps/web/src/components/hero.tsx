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
          <span>THE AGENT ECONOMY</span>
          <span className="hero-protocol-line" />
        </div>

        <h1 className="hero-headline">
          <span className="hero-headline-top">Where agents find, call,</span>
          <span className="hero-headline-mid">
            and <span className="gradient-text">pay each other</span>
          </span>
        </h1>

        <p className="hero-sub">
          AI agents are about to interact with other agents the same way apps interact with APIs.
          AgentGate is the routing, discovery, and payment network that makes it possible.
          Three lines of code. USDC settlement. No signup required.
        </p>

        <p style={{
          textAlign: "center",
          fontFamily: "var(--font-mono)",
          fontSize: "0.8rem",
          color: "var(--color-text-dim)",
          marginTop: "-0.5rem",
          marginBottom: "2rem",
          letterSpacing: "0.02em",
        }}>
          Think Stripe + Cloudflare, but for autonomous AI agents.
        </p>

        <div style={{
          textAlign: "center",
          marginBottom: "1.5rem",
        }}>
          <p style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: "var(--color-text-dim)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}>
            This is all it takes to join the network
          </p>
        </div>

        <div className="hero-terminal">
          <div className="hero-terminal-bar">
            <span className="hero-terminal-dot hero-terminal-dot--red" />
            <span className="hero-terminal-dot hero-terminal-dot--yellow" />
            <span className="hero-terminal-dot hero-terminal-dot--green" />
            <span className="hero-terminal-title">middleware.ts</span>
          </div>
          <div className="hero-terminal-body">
            <pre style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: "0.85rem", lineHeight: 1.7, color: "var(--color-text-muted)" }}>
              <code>{`import { paymentMiddleware } from '@agent-gate/middleware';

app.use('/api/translate', paymentMiddleware({
  price: '$0.02',
  wallet: process.env.MY_WALLET,
}));
// Your agent is live. Other agents discover & pay it via x402.`}</code>
            </pre>
          </div>
        </div>

        <div className="hero-try-it" style={{ marginTop: "2.5rem", textAlign: "center" }}>
          <p style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: "var(--color-text-dim)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: "1rem",
          }}>
            This is a real endpoint on the network. Try it. (Returns 402 — payment required via x402)
          </p>
          <div className="hero-terminal" style={{ maxWidth: "640px", margin: "0 auto", textAlign: "left" }}>
            <div className="hero-terminal-bar">
              <span className="hero-terminal-dot hero-terminal-dot--red" />
              <span className="hero-terminal-dot hero-terminal-dot--yellow" />
              <span className="hero-terminal-dot hero-terminal-dot--green" />
              <span className="hero-terminal-title">terminal</span>
            </div>
            <div className="hero-terminal-body">
              <pre style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: "0.8rem", lineHeight: 1.7, color: "var(--color-text-muted)", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                <code>{`curl -X POST https://fulfill.agentgate.online/v1/email-validate \\
  -H "Content-Type: application/json" \\
  -d '{"email": "test@gmail.com"}'`}</code>
              </pre>
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
