import React from "react";

const steps = [
  {
    num: "1",
    title: "Install",
    desc: "Add the middleware to your existing project.",
    code: "npm install @agent-gate/middleware",
  },
  {
    num: "2",
    title: "Configure",
    desc: "Wrap any route with x402 payment gating.",
    code: `import { Hono } from 'hono';
import { paymentMiddleware } from '@agent-gate/middleware';

const app = new Hono();

app.use('/api/translate', paymentMiddleware({
  price: '$0.02',
  wallet: process.env.MY_WALLET,
}));

app.post('/api/translate', (c) => {
  // Your existing handler — unchanged
  return c.json({ translated: '...' });
});`,
  },
  {
    num: "3",
    title: "Deploy",
    desc: "Push to your host. No special infra needed.",
    code: "git push origin main",
  },
  {
    num: "4",
    title: "Earn",
    desc: "Agents hit your endpoint and pay USDC per call via x402.",
    code: `# Agent calls your endpoint without pre-registration
> POST /api/translate
< HTTP/1.1 402 Payment Required
< x-402-price: 0.02
< x-402-network: base
< x-402-wallet: 0xYourWallet...

# Agent's x402 client auto-pays, retries with proof
> POST /api/translate
> x-402-payment: <signed_tx>
< HTTP/1.1 200 OK
< { "translated": "Bonjour le monde" }`,
  },
];

export function Quickstart() {
  return (
    <section className="quickstart">
      <div className="container">
        <h2 className="section-title" style={{ textAlign: "center" }}>
          <span className="gradient-text">Quickstart</span>
        </h2>
        <p className="section-subtitle" style={{ textAlign: "center" }}>
          From zero to earning USDC in under 5 minutes.
        </p>

        <div className="quickstart-steps">
          {steps.map((step) => (
            <div key={step.num} className="quickstart-step">
              <div className="quickstart-step-header">
                <span className="quickstart-step-num">{step.num}</span>
                <div>
                  <h3 className="quickstart-step-title">{step.title}</h3>
                  <p className="quickstart-step-desc">{step.desc}</p>
                </div>
              </div>
              <div className="code-block">
                <div className="code-block-header">
                  <span className="code-block-dot" />
                  <span className="code-block-dot" />
                  <span className="code-block-dot" />
                </div>
                <pre>
                  <code>{step.code}</code>
                </pre>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
