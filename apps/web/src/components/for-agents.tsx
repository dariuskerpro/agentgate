import React from "react";

export function ForAgents() {
  return (
    <section style={{ padding: "4rem 2rem" }}>
      <h2 style={{ fontSize: "2rem", textAlign: "center", marginBottom: "2rem" }}>For AI Agents</h2>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <p style={{ marginBottom: "1rem" }}>
          Discover and pay for APIs programmatically. One endpoint to search the entire marketplace.
        </p>
        <pre
          style={{
            background: "#1e293b",
            color: "#e2e8f0",
            padding: "1.5rem",
            borderRadius: "0.5rem",
            overflow: "auto",
          }}
        >
{`// Discover APIs
const res = await fetch("https://api.agentgate.ai/v1/discover?category=data&q=weather");
const { endpoints } = await res.json();

// Call with x402 payment
const data = await fetch(endpoints[0].url, {
  headers: { "X-402-Payment": paymentToken },
});`}
        </pre>
      </div>
    </section>
  );
}
