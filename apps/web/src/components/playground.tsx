import React from "react";

export function Playground() {
  return (
    <section className="playground">
      <div className="container">
        <h2 className="section-title" style={{ textAlign: "center" }}>
          Try the <span className="gradient-text">API</span>
        </h2>
        <p className="section-subtitle" style={{ textAlign: "center" }}>
          Discover endpoints, pay per call with USDC, get results — all via HTTP.
        </p>

        <div className="playground-panels">
          {/* Request Panel */}
          <div className="playground-panel">
            <div className="playground-panel-header">
              <span className="playground-panel-badge playground-panel-badge--request">Request</span>
              <span className="playground-panel-method">GET /v1/discover?category=data&amp;limit=3</span>
            </div>
            <div className="playground-panel-body">
              <pre className="playground-code">
{`# No body — it's a GET request`}
              </pre>
            </div>

            <div className="playground-panel-divider" />

            <div className="playground-panel-header">
              <span className="playground-panel-badge playground-panel-badge--request">Request</span>
              <span className="playground-panel-method">POST fulfill.agentgate.online/v1/email-validate</span>
            </div>
            <div className="playground-panel-body">
              <pre className="playground-code">
{`Content-Type: application/json

{"email": "test@gmail.com"}`}
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
  "endpoints": [
    {
      "id": "ep_email_validate",
      "url": "https://fulfill.agentgate.online/v1/email-validate",
      "method": "POST",
      "description": "Email validation — format, MX records, disposable detection, typo suggestions",
      "category": "data",
      "price_usdc": "0.00050000",
      "pricing_mode": "flat",
      "network": "eip155:8453",
      "active": true
    }
  ],
  "total": 11,
  "limit": 3,
  "offset": 0
}`}
              </pre>
            </div>

            <div className="playground-panel-divider" />

            <div className="playground-panel-header">
              <span className="playground-panel-badge playground-panel-badge--response">402</span>
              <span className="playground-panel-method">Payment Required</span>
            </div>
            <div className="playground-panel-body">
              <pre className="playground-code">
{`HTTP/1.1 402 Payment Required
Payment-Required: <x402 payment details>

# Agent pays USDC, retries with payment proof
# → gets result`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
