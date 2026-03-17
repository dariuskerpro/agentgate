import React from "react";

export function Pricing() {
  return (
    <section className="pricing-section">
      <div className="container">
        <h2 className="section-title">
          <span className="gradient-text">Agent-Native Pricing</span>
        </h2>
        <p className="section-subtitle">
          Charge fractions of a cent per call. No subscriptions, no minimums, no invoices.
          Every transaction settles instantly in USDC on Base &amp; Solana.
        </p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1.5rem",
          maxWidth: "1000px",
          margin: "3rem auto 0",
        }}>
          {/* Micropayment hero stat */}
          <div style={{
            gridColumn: "1 / -1",
            textAlign: "center",
            padding: "3rem 2rem",
            background: "var(--color-card)",
            border: "1px solid var(--color-card-border)",
            borderRadius: "1rem",
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "400px",
              height: "400px",
              background: "radial-gradient(circle, rgba(139, 92, 246, 0.08), transparent 70%)",
              pointerEvents: "none",
            }} />
            <div style={{
              fontFamily: "var(--font-mono)",
              fontSize: "3.5rem",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              marginBottom: "0.75rem",
              background: "linear-gradient(135deg, var(--color-violet), var(--color-indigo))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              $0.0001
            </div>
            <p style={{
              color: "var(--color-text-muted)",
              fontSize: "1.125rem",
              marginBottom: "0.5rem",
            }}>
              per agent call — and you still profit
            </p>
            <p style={{
              color: "var(--color-text-dim)",
              fontSize: "0.875rem",
              fontFamily: "var(--font-mono)",
            }}>
              No payment processor handles this. x402 does.
            </p>
          </div>

          {/* Utility tier */}
          <div className="pricing-card">
            <div className="pricing-card-label">UTILITY</div>
            <h3>Utility Agents</h3>
            <div className="pricing-card-price">
              $0.0001 – $0.0005<span> /call</span>
            </div>
            <ul>
              <li>Email validation</li>
              <li>DNS lookup</li>
              <li>IP geolocation</li>
              <li>Crypto prices</li>
              <li>Phone validation</li>
              <li>URL metadata</li>
            </ul>
            <p style={{
              color: "var(--color-text-dim)",
              fontSize: "0.8125rem",
              marginTop: "1rem",
              lineHeight: 1.5,
            }}>
              Flat per-call pricing. Set it and forget it.
            </p>
          </div>

          {/* AI tier */}
          <div className="pricing-card featured">
            <div className="pricing-card-label">AI INFERENCE</div>
            <h3>AI Agents</h3>
            <div className="pricing-card-price">
              Dynamic<span> — scales with input</span>
            </div>
            <ul>
              <li>Code review (Claude)</li>
              <li>Transcription (Whisper)</li>
              <li>PDF extraction (Gemini)</li>
              <li>Scrape &amp; enrich</li>
              <li>Transcript → PRD</li>
            </ul>
            <p style={{
              color: "var(--color-text-dim)",
              fontSize: "0.8125rem",
              marginTop: "1rem",
              lineHeight: 1.5,
            }}>
              Price tracks actual model costs with 3% markup. Small input = small price.
            </p>
          </div>

          {/* Build your own */}
          <div className="pricing-card">
            <div className="pricing-card-label">YOUR AGENT</div>
            <h3>Deploy Your Own</h3>
            <div className="pricing-card-price">
              You set the price<span></span>
            </div>
            <ul>
              <li>Any REST endpoint</li>
              <li>Any pricing model</li>
              <li>Your wallet, your revenue</li>
              <li>3 lines of middleware</li>
            </ul>
            <p style={{
              color: "var(--color-text-dim)",
              fontSize: "0.8125rem",
              marginTop: "1rem",
              lineHeight: 1.5,
            }}>
              Deploy your agent to the network with your own pricing. Other agents find and pay you automatically.
            </p>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
          <p style={{
            color: "var(--color-text-dim)",
            fontSize: "0.875rem",
            fontFamily: "var(--font-mono)",
          }}>
            Powered by x402 protocol. Self-hosted facilitator or bring your own.
          </p>
        </div>
      </div>
    </section>
  );
}
