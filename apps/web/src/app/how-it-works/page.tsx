import React from "react";
import type { Metadata } from "next";
import { Footer } from "../../components/footer";

export const metadata: Metadata = {
  title: "How AgentGate Works — The Full Stack Explained",
  description:
    "AgentGate is 5 layers: Discovery, Middleware, Payment (x402), Fulfillment, and Agent Integrations. Understand how each piece fits together.",
};

function Layer({
  num,
  title,
  subtitle,
  color,
  children,
}: {
  num: string;
  title: string;
  subtitle: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        marginBottom: "5rem",
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            fontWeight: 700,
            color: "#fff",
            background: color,
            width: "2rem",
            height: "2rem",
            borderRadius: "0.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {num}
        </span>
        <div>
          <h2
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              margin: 0,
              color: "var(--color-text)",
            }}
          >
            {title}
          </h2>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--color-text-dim)",
              margin: 0,
              marginTop: "0.25rem",
            }}
          >
            {subtitle}
          </p>
        </div>
      </div>
      {children}
    </div>
  );
}

function CodeBox({ title, code }: { title: string; code: string }) {
  return (
    <div
      style={{
        background: "var(--color-code-bg)",
        border: "1px solid var(--color-card-border)",
        borderRadius: "0.75rem",
        overflow: "hidden",
        marginBottom: "1.5rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.625rem 1rem",
          borderBottom: "1px solid var(--color-card-border)",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <span
          style={{
            width: "0.625rem",
            height: "0.625rem",
            borderRadius: "50%",
            background: "#ef4444",
          }}
        />
        <span
          style={{
            width: "0.625rem",
            height: "0.625rem",
            borderRadius: "50%",
            background: "#eab308",
          }}
        />
        <span
          style={{
            width: "0.625rem",
            height: "0.625rem",
            borderRadius: "50%",
            background: "#22c55e",
          }}
        />
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.6875rem",
            color: "var(--color-text-dim)",
            marginLeft: "0.5rem",
          }}
        >
          {title}
        </span>
      </div>
      <pre
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.8125rem",
          lineHeight: 1.7,
          padding: "1.25rem",
          margin: 0,
          overflow: "auto",
          color: "var(--color-text-muted)",
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

function Callout({
  icon,
  text,
  color,
}: {
  icon: string;
  text: string;
  color: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: "0.75rem",
        padding: "1rem 1.25rem",
        background: `${color}08`,
        border: `1px solid ${color}25`,
        borderRadius: "0.75rem",
        marginBottom: "1.5rem",
        fontSize: "0.875rem",
        color: "var(--color-text-muted)",
        lineHeight: 1.6,
      }}
    >
      <span style={{ fontSize: "1.25rem", flexShrink: 0 }}>{icon}</span>
      <span>{text}</span>
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <main className="grid-bg">
      <section style={{ padding: "8rem 1.5rem 4rem" }}>
        <div className="container" style={{ maxWidth: "52rem" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "5rem" }}>
            <div
              style={{
                color: "var(--color-text-dim)",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                fontSize: "0.6875rem",
                marginBottom: "1.5rem",
              }}
            >
              HOW IT WORKS
            </div>
            <h1
              style={{
                fontSize: "clamp(2rem, 5vw, 3.25rem)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                marginBottom: "1.5rem",
                lineHeight: 1.15,
              }}
            >
              AgentGate is{" "}
              <span className="gradient-text">5 layers</span>,<br />
              not just payments
            </h1>
            <p
              className="section-subtitle"
              style={{
                textAlign: "center",
                maxWidth: "38rem",
                margin: "0 auto",
                lineHeight: 1.7,
              }}
            >
              x402 is the payment rail — one layer. AgentGate solves the full
              loop: how does an agent <strong>find</strong>, <strong>pay for</strong>,
              and <strong>use</strong> an API — and how does a developer{" "}
              <strong>monetize</strong> one?
            </p>
          </div>

          {/* Visual Stack */}
          <div
            style={{
              marginBottom: "5rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem",
            }}
          >
            {[
              { num: "5", label: "Agent Integrations", sub: "MCP · LangChain · CrewAI · SDKs", color: "#8b5cf6" },
              { num: "4", label: "Discovery", sub: "Marketplace API · Search · Categories", color: "#6366f1" },
              { num: "3", label: "Payment", sub: "x402 · USDC · Base · Solana", color: "#3b82f6" },
              { num: "2", label: "Middleware", sub: "Express · Hono · Next.js · 3 lines of code", color: "#06b6d4" },
              { num: "1", label: "Fulfillment", sub: "11 live AI endpoints · Your endpoints", color: "#10b981" },
            ].map((layer) => (
              <div
                key={layer.num}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "1rem 1.5rem",
                  background: `${layer.color}12`,
                  border: `1px solid ${layer.color}30`,
                  borderRadius: "0.75rem",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#fff",
                    background: layer.color,
                    width: "1.75rem",
                    height: "1.75rem",
                    borderRadius: "0.375rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {layer.num}
                </span>
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "1rem",
                      color: "var(--color-text)",
                    }}
                  >
                    {layer.label}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.75rem",
                      color: "var(--color-text-dim)",
                      marginTop: "0.125rem",
                    }}
                  >
                    {layer.sub}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Layer 1: Fulfillment */}
          <Layer
            num="1"
            title="Fulfillment — The Endpoints"
            subtitle="The actual AI services that do real work"
            color="#10b981"
          >
            <p
              style={{
                color: "var(--color-text-muted)",
                lineHeight: 1.7,
                marginBottom: "1.5rem",
              }}
            >
              At the bottom of the stack are real API endpoints — services that
              accept input and return results. AgentGate runs 11 live endpoints
              powered by Whisper, Claude, Gemini, and pure Node.js. But any
              developer can add their own.
            </p>

            <CodeBox
              title="try it — this is a real endpoint"
              code={`curl -X POST https://fulfill.agentgate.online/v1/email-validate \\
  -H "Content-Type: application/json" \\
  -d '{"email": "test@gmail.com"}'

# → 402 Payment Required
# This endpoint works. It just needs payment first.`}
            />

            <Callout
              icon="💡"
              text="These aren't stubs. Every endpoint runs real AI inference or real utility logic. The payment gate is the only thing between you and the result."
              color="#10b981"
            />
          </Layer>

          {/* Layer 2: Middleware */}
          <Layer
            num="2"
            title="Middleware — The Payment Gate"
            subtitle="Add pay-per-call to any existing API in 3 lines"
            color="#06b6d4"
          >
            <p
              style={{
                color: "var(--color-text-muted)",
                lineHeight: 1.7,
                marginBottom: "1.5rem",
              }}
            >
              The middleware sits in front of your endpoint and handles the x402
              payment flow. When a request comes in without payment, it returns
              <code
                style={{
                  fontFamily: "var(--font-mono)",
                  background: "var(--color-code-bg)",
                  padding: "0.15rem 0.4rem",
                  borderRadius: "4px",
                  fontSize: "0.8125rem",
                }}
              >
                {" "}
                402 Payment Required
              </code>
              . When payment is attached, it verifies and lets the request through.
            </p>

            <CodeBox
              title="your-api.ts — that's it, 3 lines"
              code={`import { paymentMiddleware } from '@agent-gate/middleware/hono';

app.use('/api/translate', paymentMiddleware({
  price: '$0.02',          // USDC per call
  wallet: process.env.MY_WALLET,
}));

// Your handler runs ONLY after payment is verified
app.post('/api/translate', async (c) => {
  const { text, to } = await c.req.json();
  return c.json({ translated: await translate(text, to) });
});`}
            />

            <p
              style={{
                color: "var(--color-text-muted)",
                lineHeight: 1.7,
                marginBottom: "1.5rem",
              }}
            >
              Works with <strong>Express</strong>, <strong>Hono</strong>, and{" "}
              <strong>Next.js</strong>. Your existing code doesn&apos;t change — you
              just add the middleware.
            </p>

            <Callout
              icon="🔑"
              text="This is the key insight: sellers don't need to build a billing system, manage API keys, or send invoices. The middleware handles everything. Set a price, set a wallet, deploy."
              color="#06b6d4"
            />
          </Layer>

          {/* Layer 3: Payment */}
          <Layer
            num="3"
            title="Payment — x402 + Facilitator"
            subtitle="USDC payments over HTTP, verified on-chain"
            color="#3b82f6"
          >
            <p
              style={{
                color: "var(--color-text-muted)",
                lineHeight: 1.7,
                marginBottom: "1.5rem",
              }}
            >
              x402 is{" "}
              <a
                href="https://x402.org"
                style={{ color: "var(--color-violet)" }}
                target="_blank"
                rel="noopener"
              >
                Coinbase&apos;s open protocol
              </a>{" "}
              for native HTTP payments. It adds a payment header to standard HTTP
              requests — no API keys, no accounts, no invoices. AgentGate uses
              x402 under the hood, but you don&apos;t need to understand it to use
              AgentGate.
            </p>

            <CodeBox
              title="the x402 payment flow"
              code={`# Step 1: Agent calls endpoint (no payment)
POST /v1/transcribe → 402 Payment Required
← Header: price=$0.015, network=base, payTo=0x4C...

# Step 2: Agent signs USDC payment and retries
POST /v1/transcribe
→ Header: X-PAYMENT: <signed USDC transfer>

# Step 3: Facilitator verifies payment on-chain
✓ Payment valid → settle on Base/Solana

# Step 4: Endpoint returns result
← 200 OK: { "transcript": "Hello world..." }`}
            />

            <p
              style={{
                color: "var(--color-text-muted)",
                lineHeight: 1.7,
                marginBottom: "1.5rem",
              }}
            >
              The <strong>Facilitator</strong> is the payment verifier. It checks
              that the USDC payment is real before the endpoint runs. AgentGate
              runs its own facilitator supporting both <strong>Base</strong> (EVM)
              and <strong>Solana</strong> mainnet — unlike the public x402
              facilitator which only supports testnet.
            </p>

            <Callout
              icon="⛓️"
              text="Payments are real USDC on real chains. Not wrapped tokens, not IOUs, not credits. When an agent calls your endpoint, USDC moves to your wallet."
              color="#3b82f6"
            />
          </Layer>

          {/* Layer 4: Discovery */}
          <Layer
            num="4"
            title="Discovery — The Marketplace"
            subtitle="Agents search for endpoints by capability, price, or category"
            color="#6366f1"
          >
            <p
              style={{
                color: "var(--color-text-muted)",
                lineHeight: 1.7,
                marginBottom: "1.5rem",
              }}
            >
              Before an agent can pay for a service, it needs to find one. The
              Discovery API lets agents search the marketplace by capability,
              category, or keyword — and get back endpoint URLs, pricing, and
              descriptions.
            </p>

            <CodeBox
              title="discovery — find what you need"
              code={`# Search for transcription endpoints
curl https://api.agentgate.online/v1/discover?q=transcribe

{
  "endpoints": [{
    "url": "https://fulfill.agentgate.online/v1/transcribe",
    "description": "Audio → transcript with timestamps",
    "category": "audio",
    "price_usdc": "0.015",
    "active": true
  }]
}

# Browse by category
curl https://api.agentgate.online/v1/discover?category=code

# List all categories
curl https://api.agentgate.online/v1/discover/categories`}
            />

            <Callout
              icon="🔍"
              text="Discovery is what makes AgentGate a marketplace, not just a payment system. Agents don't need hardcoded URLs — they search for capabilities and find the best option."
              color="#6366f1"
            />
          </Layer>

          {/* Layer 5: Agent Integrations */}
          <Layer
            num="5"
            title="Agent Integrations — The Distribution Layer"
            subtitle="Let any AI agent framework discover and call endpoints natively"
            color="#8b5cf6"
          >
            <p
              style={{
                color: "var(--color-text-muted)",
                lineHeight: 1.7,
                marginBottom: "1.5rem",
              }}
            >
              The top of the stack is what agents actually interact with.
              AgentGate has native integrations for every major agent framework —
              so agents can discover, pay, and use endpoints without custom HTTP
              code.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))",
                gap: "1rem",
                marginBottom: "1.5rem",
              }}
            >
              {[
                {
                  name: "MCP Server",
                  desc: "Claude Code, Cursor, any MCP client",
                  code: "npx @agent-gate/mcp",
                },
                {
                  name: "TypeScript SDK",
                  desc: "Full client with 402 handling",
                  code: "npm i @agent-gate/sdk",
                },
                {
                  name: "Python SDK",
                  desc: "Client + LangChain + CrewAI tools",
                  code: "pip install agentgate",
                },
                {
                  name: "LangChain Tools",
                  desc: "Drop-in tool wrappers",
                  code: "AgentGateDiscoverTool()",
                },
              ].map((item) => (
                <div
                  key={item.name}
                  style={{
                    padding: "1.25rem",
                    background: "var(--color-card-bg)",
                    border: "1px solid var(--color-card-border)",
                    borderRadius: "0.75rem",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "0.9375rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    {item.name}
                  </div>
                  <div
                    style={{
                      color: "var(--color-text-dim)",
                      fontSize: "0.8125rem",
                      marginBottom: "0.75rem",
                    }}
                  >
                    {item.desc}
                  </div>
                  <code
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.75rem",
                      color: "var(--color-violet)",
                      background: "rgba(124, 58, 237, 0.1)",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "4px",
                    }}
                  >
                    {item.code}
                  </code>
                </div>
              ))}
            </div>

            <CodeBox
              title="langchain — discover and call in 2 lines"
              code={`from agentgate.langchain_tool import AgentGateDiscoverTool, AgentGateCallTool

# Add to your agent's toolkit
tools = [AgentGateDiscoverTool(), AgentGateCallTool()]

# Agent autonomously:
# 1. Discovers "I need transcription" → finds /v1/transcribe
# 2. Calls it with payment → gets transcript back
# No hardcoded URLs. No API keys. No human in the loop.`}
            />

            <Callout
              icon="🤖"
              text="This is the endgame. An agent that can discover capabilities, pay for them, and use the results — all autonomously. No human signing up for APIs, managing keys, or paying invoices."
              color="#8b5cf6"
            />
          </Layer>

          {/* Full Flow */}
          <div
            style={{
              marginTop: "3rem",
              padding: "2.5rem",
              background: "var(--color-card-bg)",
              border: "1px solid var(--color-card-border)",
              borderRadius: "1rem",
              textAlign: "center",
            }}
          >
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                marginBottom: "1.5rem",
              }}
            >
              The Full Loop
            </h2>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.875rem",
                color: "var(--color-text-muted)",
                lineHeight: 2.2,
              }}
            >
              <div>
                <span style={{ color: "#8b5cf6" }}>Agent (MCP/LangChain/SDK)</span>
              </div>
              <div style={{ color: "var(--color-text-dim)" }}>↓ &quot;I need transcription&quot;</div>
              <div>
                <span style={{ color: "#6366f1" }}>Discovery API</span>{" "}
                <span style={{ color: "var(--color-text-dim)" }}>→ finds /v1/transcribe at $0.015</span>
              </div>
              <div style={{ color: "var(--color-text-dim)" }}>↓ POST with audio file</div>
              <div>
                <span style={{ color: "#06b6d4" }}>Middleware</span>{" "}
                <span style={{ color: "var(--color-text-dim)" }}>→ returns 402, price=$0.015</span>
              </div>
              <div style={{ color: "var(--color-text-dim)" }}>↓ signs USDC payment, retries</div>
              <div>
                <span style={{ color: "#3b82f6" }}>Facilitator</span>{" "}
                <span style={{ color: "var(--color-text-dim)" }}>→ verifies payment on Base</span>
              </div>
              <div style={{ color: "var(--color-text-dim)" }}>↓ payment valid</div>
              <div>
                <span style={{ color: "#10b981" }}>Endpoint (Whisper)</span>{" "}
                <span style={{ color: "var(--color-text-dim)" }}>→ returns transcript</span>
              </div>
              <div
                style={{
                  marginTop: "1rem",
                  fontSize: "0.8125rem",
                  color: "var(--color-text-dim)",
                }}
              >
                Total time: ~3 seconds · Cost: $0.015 USDC · No signup · No API key
              </div>
            </div>
          </div>

          {/* CTA */}
          <div style={{ textAlign: "center", marginTop: "4rem" }}>
            <a
              href="/docs/getting-started"
              style={{
                display: "inline-block",
                background:
                  "linear-gradient(135deg, var(--color-violet), var(--color-indigo))",
                color: "#fff",
                fontSize: "1rem",
                fontWeight: 600,
                padding: "0.875rem 2rem",
                borderRadius: "0.625rem",
                textDecoration: "none",
                marginRight: "1rem",
              }}
            >
              Start Building →
            </a>
            <a
              href="/marketplace"
              style={{
                display: "inline-block",
                background: "transparent",
                color: "var(--color-text-muted)",
                fontSize: "1rem",
                fontWeight: 500,
                padding: "0.875rem 2rem",
                borderRadius: "0.625rem",
                textDecoration: "none",
                border: "1px solid var(--color-card-border)",
              }}
            >
              Browse Endpoints
            </a>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
