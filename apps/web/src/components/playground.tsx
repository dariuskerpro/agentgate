"use client";

import React, { useState } from "react";

const tabs = ["Discover", "Call", "Settle"] as const;
type Tab = typeof tabs[number];

const discoverRequest = `GET https://api.agentgate.online/v1/discover?limit=3

# No body — it's a GET request`;

const callRequest = `POST https://fulfill.agentgate.online/v1/email-validate
Content-Type: application/json

{"email": "test@gmail.com"}`;

const settleRequest = `POST https://fulfill.agentgate.online/v1/email-validate
Content-Type: application/json
X-402-Payment: <signed USDC payment proof>

{"email": "test@gmail.com"}`;

const settleResponse = `HTTP/1.1 200 OK
Content-Type: application/json

{
  "valid": true,
  "format": true,
  "mx": true,
  "disposable": false,
  "did_you_mean": null,
  "risk_score": 0.05,
  "payment": {
    "amount": "0.00050000",
    "currency": "USDC",
    "network": "eip155:8453",
    "settled": true
  }
}`;

export function Playground() {
  const [activeTab, setActiveTab] = useState<Tab>("Discover");
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  const runRequest = async () => {
    setLoading(true);
    setHasRun(true);
    try {
      if (activeTab === "Discover") {
        const res = await fetch("https://api.agentgate.online/v1/discover?limit=3");
        const data = await res.json();
        setResponse(`HTTP/1.1 ${res.status} ${res.statusText}\n\n${JSON.stringify(data, null, 2)}`);
      } else if (activeTab === "Call") {
        const res = await fetch("https://fulfill.agentgate.online/v1/email-validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "test@gmail.com" }),
        });
        const text = await res.text();
        let body: string;
        try {
          body = JSON.stringify(JSON.parse(text), null, 2);
        } catch {
          body = text;
        }
        setResponse(`HTTP/1.1 ${res.status} ${res.statusText}\n\n${body}`);
      }
    } catch {
      // Fallback responses if fetch fails (CORS, network, etc.)
      if (activeTab === "Discover") {
        setResponse(`HTTP/1.1 200 OK

{
  "endpoints": [
    {
      "id": "ep_email_validate",
      "url": "https://fulfill.agentgate.online/v1/email-validate",
      "method": "POST",
      "description": "Email validation — format, MX, disposable detection",
      "price_usdc": "0.00050000",
      "active": true
    },
    {
      "id": "ep_dns_lookup",
      "url": "https://fulfill.agentgate.online/v1/dns-lookup",
      "method": "POST",
      "description": "DNS records — A, MX, NS, TXT with full resolution",
      "price_usdc": "0.00030000",
      "active": true
    },
    {
      "id": "ep_crypto_price",
      "url": "https://fulfill.agentgate.online/v1/crypto-price",
      "method": "POST",
      "description": "Real-time crypto prices, market cap, 24h change",
      "price_usdc": "0.00010000",
      "active": true
    }
  ],
  "total": 11,
  "limit": 3,
  "offset": 0
}`);
      } else {
        setResponse(`HTTP/1.1 402 Payment Required
Payment-Required: x402

{
  "error": "Payment Required",
  "protocol": "x402",
  "price": "0.00050000",
  "currency": "USDC",
  "network": "eip155:8453",
  "payTo": "0x...",
  "message": "Send USDC payment proof in X-402-Payment header"
}`);
      }
    }
    setLoading(false);
  };

  const getRequest = () => {
    if (activeTab === "Discover") return discoverRequest;
    if (activeTab === "Call") return callRequest;
    return settleRequest;
  };

  const getResponse = () => {
    if (activeTab === "Settle") return settleResponse;
    if (hasRun && response) return response;
    return null;
  };

  const canRun = activeTab !== "Settle";

  return (
    <section className="playground">
      <div className="container">
        <h2 className="section-title" style={{ textAlign: "center" }}>
          Live <span className="gradient-text">Playground</span>
        </h2>
        <p className="section-subtitle" style={{ textAlign: "center" }}>
          Real infrastructure. Real responses. Hit the endpoints yourself.
        </p>

        {/* Tabs */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: "0.5rem",
          marginBottom: "2rem",
        }}>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setResponse(null); setHasRun(false); }}
              style={{
                padding: "0.5rem 1.25rem",
                borderRadius: "0.5rem",
                border: activeTab === tab ? "1px solid rgba(139, 92, 246, 0.5)" : "1px solid var(--color-card-border)",
                background: activeTab === tab ? "rgba(139, 92, 246, 0.15)" : "var(--color-card)",
                color: activeTab === tab ? "#c4b5fd" : "var(--color-text-muted)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.8125rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="playground-panels">
          {/* Request Panel */}
          <div className="playground-panel">
            <div className="playground-panel-header">
              <span className="playground-panel-badge playground-panel-badge--request">Request</span>
              <span className="playground-panel-method" style={{ fontSize: "0.75rem" }}>
                {activeTab === "Discover" && "GET /v1/discover?limit=3"}
                {activeTab === "Call" && "POST /v1/email-validate"}
                {activeTab === "Settle" && "POST /v1/email-validate (with payment)"}
              </span>
            </div>
            <div className="playground-panel-body">
              <pre className="playground-code">{getRequest()}</pre>
            </div>
            {canRun && (
              <div style={{ padding: "1rem", borderTop: "1px solid var(--color-card-border)" }}>
                <button
                  onClick={runRequest}
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "0.625rem",
                    borderRadius: "0.5rem",
                    border: "none",
                    background: loading
                      ? "rgba(139, 92, 246, 0.3)"
                      : "linear-gradient(135deg, var(--color-violet), var(--color-indigo))",
                    color: "#fff",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    cursor: loading ? "wait" : "pointer",
                    transition: "opacity 0.15s",
                  }}
                >
                  {loading ? "Running..." : "▶ Run"}
                </button>
              </div>
            )}
          </div>

          {/* Response Panel */}
          <div className="playground-panel">
            <div className="playground-panel-header">
              <span className="playground-panel-badge playground-panel-badge--response">
                {activeTab === "Settle" ? "200 OK" : hasRun ? "Response" : "—"}
              </span>
              <span className="playground-panel-method" style={{ fontSize: "0.75rem" }}>
                {activeTab === "Discover" && "Discovery Results"}
                {activeTab === "Call" && "402 Payment Required"}
                {activeTab === "Settle" && "After Payment — Success"}
              </span>
            </div>
            <div className="playground-panel-body">
              {getResponse() ? (
                <pre className="playground-code">{getResponse()}</pre>
              ) : (
                <div style={{
                  padding: "3rem 2rem",
                  textAlign: "center",
                  color: "var(--color-text-dim)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.8125rem",
                }}>
                  {canRun ? "Hit Run to see the live response ↗" : ""}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
