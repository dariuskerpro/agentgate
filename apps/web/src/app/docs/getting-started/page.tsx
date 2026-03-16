import React from "react";
import { Footer } from "../../../components/footer";

export default function GettingStartedPage() {
  return (
    <main className="grid-bg">
      <section style={{ padding: "8rem 1.5rem 3rem" }}>
        <div className="container" style={{ maxWidth: "800px" }}>
          <div style={{ marginBottom: "3rem" }}>
            <a
              href="/docs"
              style={{
                color: "var(--color-violet)",
                fontSize: "0.875rem",
                fontFamily: "var(--font-mono)",
              }}
            >
              ← Back to Docs
            </a>
          </div>

          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              marginBottom: "1.5rem",
            }}
          >
            Getting Started
          </h1>

          <p
            style={{
              color: "var(--color-text-muted)",
              fontSize: "1.125rem",
              lineHeight: 1.7,
              marginBottom: "3rem",
            }}
          >
            Monetize your API for AI agents in under 5 minutes. AgentGate wraps
            your existing endpoints with x402 payment protection — agents
            discover, pay, and call your API automatically.
          </p>

          {/* Step 1 */}
          <div style={{ marginBottom: "3rem" }}>
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <span
                style={{
                  background:
                    "linear-gradient(135deg, var(--color-violet), var(--color-indigo))",
                  color: "#fff",
                  borderRadius: "0.5rem",
                  width: "2rem",
                  height: "2rem",
                  display: "inline-flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                1
              </span>
              Install
            </h2>
            <div className="code-block">
              <div className="code-block-header">
                <span className="code-block-dot" />
                <span className="code-block-dot" />
                <span className="code-block-dot" />
              </div>
              <pre>
                <code>npx @dkerpal/agent-gate init</code>
              </pre>
            </div>
            <p
              style={{
                color: "var(--color-text-muted)",
                marginTop: "0.75rem",
                fontSize: "0.9375rem",
                lineHeight: 1.6,
              }}
            >
              The CLI auto-detects your framework (Express, Hono, or Next.js),
              prompts for your wallet address, registers you on the marketplace,
              and generates a <code style={{ fontFamily: "var(--font-mono)", color: "var(--color-violet)" }}>.agentgate.json</code> config file.
            </p>
          </div>

          {/* Step 2 */}
          <div style={{ marginBottom: "3rem" }}>
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <span
                style={{
                  background:
                    "linear-gradient(135deg, var(--color-violet), var(--color-indigo))",
                  color: "#fff",
                  borderRadius: "0.5rem",
                  width: "2rem",
                  height: "2rem",
                  display: "inline-flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                2
              </span>
              Add the Middleware
            </h2>
            <div className="code-block">
              <div className="code-block-header">
                <span className="code-block-dot" />
                <span className="code-block-dot" />
                <span className="code-block-dot" />
                <span className="code-block-title">server.ts</span>
              </div>
              <pre>
                <code>{`import express from 'express';
import { agentgate } from '@agent-gate/middleware/express';

const app = express();

// Reads config from .agentgate.json
app.use(agentgate());

// Your routes — now payment-protected
app.get('/api/data', (req, res) => {
  res.json({ result: 'your data here' });
});

app.listen(3000);`}</code>
              </pre>
            </div>
          </div>

          {/* Step 3 */}
          <div style={{ marginBottom: "3rem" }}>
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <span
                style={{
                  background:
                    "linear-gradient(135deg, var(--color-violet), var(--color-indigo))",
                  color: "#fff",
                  borderRadius: "0.5rem",
                  width: "2rem",
                  height: "2rem",
                  display: "inline-flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                3
              </span>
              Deploy &amp; Earn
            </h2>
            <p
              style={{
                color: "var(--color-text-muted)",
                fontSize: "0.9375rem",
                lineHeight: 1.6,
              }}
            >
              Deploy your app as usual. AgentGate handles everything:
            </p>
            <ul
              style={{
                color: "var(--color-text-muted)",
                fontSize: "0.9375rem",
                lineHeight: 2,
                marginTop: "0.75rem",
                listStyle: "none",
                padding: 0,
              }}
            >
              <li>✅ Your endpoints appear in the marketplace</li>
              <li>✅ Agents discover them via the Discovery API</li>
              <li>✅ x402 payment verification happens automatically</li>
              <li>✅ USDC settles to your wallet on Base or Solana</li>
            </ul>
          </div>

          {/* API Reference */}
          <div
            style={{
              marginTop: "4rem",
              padding: "2rem",
              background: "var(--color-card)",
              border: "1px solid var(--color-card-border)",
              borderRadius: "1rem",
            }}
          >
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                marginBottom: "1rem",
              }}
            >
              🔍 Discovery API
            </h3>
            <p
              style={{
                color: "var(--color-text-muted)",
                marginBottom: "1rem",
                fontSize: "0.9375rem",
              }}
            >
              Browse available endpoints programmatically:
            </p>
            <div className="code-block">
              <pre>
                <code>{`# List all endpoints
curl https://api.agentgate.online/v1/discover

# Filter by category
curl https://api.agentgate.online/v1/discover?category=code

# List categories
curl https://api.agentgate.online/v1/discover/categories`}</code>
              </pre>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: "4rem" }}>
            <a href="/marketplace" className="btn-secondary">
              Browse the Marketplace →
            </a>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
