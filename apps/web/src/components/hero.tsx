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
          <span>x402 PAYMENT PROTOCOL</span>
          <span className="hero-protocol-line" />
        </div>

        <h1 className="hero-headline">
          <span className="hero-headline-top">Monetize any API</span>
          <span className="hero-headline-mid">
            in <span className="gradient-text">3 lines of code</span>
          </span>
        </h1>

        <p className="hero-sub">
          Charge fractions of a cent per API call — and actually profit from it.
          AI agents discover, pay, and use your endpoints automatically.
          No signup. No invoicing. Just HTTP + USDC.
        </p>

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
// That's it. Agents pay USDC per call via x402.`}</code>
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
            This is a real endpoint. Try it. (Returns 402 — payment required via x402)
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
