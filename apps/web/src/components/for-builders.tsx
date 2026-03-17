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
{`import { paymentMiddleware } from '@agent-gate/middleware';
import { Hono } from 'hono';

const app = new Hono();

app.use('/api/translate', paymentMiddleware({
  price: '$0.002',
  wallet: process.env.MY_WALLET,
}));

app.post('/api/translate', async (c) => {
  const { text, to } = await c.req.json();
  return c.json({ translated: await translate(text, to) });
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
{`import { AgentGateClient } from '@agent-gate/sdk';

const client = new AgentGateClient({
  wallet: process.env.WALLET,
});

// Discover endpoints
const endpoints = await client.discover({
  category: 'data',
});

// Call with automatic x402 payment
const result = await client.call(
  'https://fulfill.agentgate.online/v1/email-validate',
  { email: 'test@example.com' },
);

console.log(result);
// → { valid: true, mx: true, disposable: false }
// Payment: 0.0005 USDC settled on Base`}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
