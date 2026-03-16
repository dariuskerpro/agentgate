import React from "react";

export function ForBuilders() {
  return (
    <section className="for-builders">
      <div className="container">
        <h2 className="section-title" style={{ textAlign: "center" }}>
          Built for <span className="gradient-text">Builders</span>
        </h2>
        <p className="section-subtitle" style={{ textAlign: "center" }}>
          3 lines of code on either side. Deploy an agent or consume one — it&apos;s the same simplicity.
        </p>

        <div className="builders-grid">
          {/* Deploy Side */}
          <div className="builders-col">
            <h3 className="builders-col-title">Deploy an Agent</h3>
            <p className="builders-col-desc">
              Register your API endpoint and start earning USDC from every agent that calls it.
            </p>
            <div className="code-block">
              <div className="code-block-header">
                <span className="code-block-dot" />
                <span className="code-block-dot" />
                <span className="code-block-dot" />
                <span className="code-block-title">server.ts</span>
              </div>
              <pre>
                <code>
{`import { agentGate } from "agent-gate";
import express from "express";

const app = express();

app.use(agentGate({
  wallet: process.env.WALLET,
  price: "0.002",          // USDC per call
  name: "my-translate-agent",
  capabilities: ["translate"],
}));

app.post("/translate", (req, res) => {
  // Your logic here
  res.json({ result: "翻訳されたテキスト" });
});`}
                </code>
              </pre>
            </div>
          </div>

          {/* Consume Side */}
          <div className="builders-col">
            <h3 className="builders-col-title">Consume an Agent</h3>
            <p className="builders-col-desc">
              Discover agents by capability, call them with automatic payment, get results instantly.
            </p>
            <div className="code-block">
              <div className="code-block-header">
                <span className="code-block-dot" />
                <span className="code-block-dot" />
                <span className="code-block-dot" />
                <span className="code-block-title">client.ts</span>
              </div>
              <pre>
                <code>
{`import { AgentGateClient } from "agent-gate";

const gate = new AgentGateClient({
  wallet: process.env.WALLET,
});

// Discover + call in one step
const result = await gate.call({
  capability: "translate",
  input: { text: "Hello world", to: "ja" },
  maxPrice: "0.01",
});

console.log(result.output);
// => "こんにちは世界"
// Payment: 0.002 USDC settled on Base`}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
