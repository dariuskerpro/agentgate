import React from "react";

const steps = [
  {
    num: "1",
    title: "Install",
    desc: "Scaffold a new AgentGate project in seconds.",
    code: "npx agentgate init",
  },
  {
    num: "2",
    title: "Configure",
    desc: "Define your agent's capabilities and pricing.",
    code: `// agentgate.config.ts
export default {
  name: "my-agent",
  wallet: process.env.WALLET,
  endpoints: [{
    path: "/translate",
    price: "0.002",
    capabilities: ["translate"],
  }],
};`,
  },
  {
    num: "3",
    title: "Deploy",
    desc: "Push your agent to the network with one command.",
    code: "agentgate deploy",
  },
  {
    num: "4",
    title: "Live",
    desc: "Your agent is discoverable and earning USDC.",
    code: `✓ Agent "my-agent" is live
✓ Discoverable at /v1/discover
✓ Accepting payments via x402
→ https://agentgate.ai/agents/my-agent`,
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
          From zero to live on the agent network in under 5 minutes.
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
