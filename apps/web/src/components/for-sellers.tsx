import React from "react";

const benefits = [
  "5-minute setup with npx agentgate init",
  "USDC payments directly to your wallet on Base",
  "Real-time analytics dashboard",
  "Works with Express, Hono, and Next.js",
  "No intermediary — agents pay you directly via x402",
];

export function ForSellers() {
  return (
    <section style={{ padding: "4rem 2rem", background: "#f8fafc" }}>
      <h2 style={{ fontSize: "2rem", textAlign: "center", marginBottom: "2rem" }}>For API Sellers</h2>
      <ul style={{ maxWidth: "600px", margin: "0 auto", lineHeight: "2" }}>
        {benefits.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>
    </section>
  );
}
