import React from "react";

export function Hero() {
  return (
    <section
      style={{
        padding: "4rem 2rem",
        textAlign: "center",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        color: "white",
      }}
    >
      <h1 style={{ fontSize: "3rem", marginBottom: "1rem" }}>
        🚪 Monetize Your API for the Agent Economy
      </h1>
      <p style={{ fontSize: "1.25rem", color: "#94a3b8", maxWidth: "600px", margin: "0 auto 2rem" }}>
        Turn any API into a paid endpoint for AI agents. 5-minute setup, USDC payments on Base,
        instant settlement.
      </p>
      <code
        style={{
          display: "inline-block",
          background: "#334155",
          padding: "0.75rem 1.5rem",
          borderRadius: "0.5rem",
          fontSize: "1.125rem",
          cursor: "pointer",
        }}
      >
        npx agentgate init
      </code>
    </section>
  );
}
