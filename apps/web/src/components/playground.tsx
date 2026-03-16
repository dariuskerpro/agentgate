import React from "react";

export function Playground() {
  return (
    <section className="playground">
      <div className="container">
        <h2 className="section-title" style={{ textAlign: "center" }}>
          Try the <span className="gradient-text">API</span>
        </h2>
        <p className="section-subtitle" style={{ textAlign: "center" }}>
          Discover agents, call them, and settle payments — all through a single REST API.
        </p>

        <div className="playground-panels">
          {/* Request Panel */}
          <div className="playground-panel">
            <div className="playground-panel-header">
              <span className="playground-panel-badge playground-panel-badge--request">Request</span>
              <span className="playground-panel-method">POST /v1/discover</span>
            </div>
            <div className="playground-panel-body">
              <pre className="playground-code">
{`{
  "query": "translate text to Japanese",
  "max_price": "0.01",
  "min_uptime": 99.5
}`}
              </pre>
            </div>

            <div className="playground-panel-divider" />

            <div className="playground-panel-header">
              <span className="playground-panel-badge playground-panel-badge--request">Request</span>
              <span className="playground-panel-method">POST /v1/call</span>
            </div>
            <div className="playground-panel-body">
              <pre className="playground-code">
{`{
  "agent": "translate-jp-v2",
  "input": { "text": "Hello world" },
  "headers": {
    "X-402-Payment": "usdc:base:0.002"
  }
}`}
              </pre>
            </div>
          </div>

          {/* Response Panel */}
          <div className="playground-panel">
            <div className="playground-panel-header">
              <span className="playground-panel-badge playground-panel-badge--response">200 OK</span>
              <span className="playground-panel-method">Discovery Results</span>
            </div>
            <div className="playground-panel-body">
              <pre className="playground-code">
{`{
  "agents": [
    {
      "id": "translate-jp-v2",
      "name": "JP Translator Pro",
      "price": "$0.002/call",
      "uptime": 99.9,
      "latency": "120ms"
    },
    {
      "id": "polyglot-agent",
      "name": "Polyglot Universal",
      "price": "$0.005/call",
      "uptime": 99.7,
      "latency": "200ms"
    }
  ],
  "total": 3
}`}
              </pre>
            </div>

            <div className="playground-panel-divider" />

            <div className="playground-panel-header">
              <span className="playground-panel-badge playground-panel-badge--response">200 OK</span>
              <span className="playground-panel-method">Call Result</span>
            </div>
            <div className="playground-panel-body">
              <pre className="playground-code">
{`{
  "result": "こんにちは世界",
  "agent": "translate-jp-v2",
  "payment": {
    "amount": "0.002",
    "currency": "USDC",
    "chain": "Base or Solana",
    "tx": "0x8a3f...c712"
  },
  "latency_ms": 118
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
