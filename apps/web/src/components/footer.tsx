import React from "react";

export function Footer() {
  return (
    <footer
      style={{
        padding: "2rem",
        textAlign: "center",
        borderTop: "1px solid #e2e8f0",
        color: "#64748b",
        fontSize: "0.875rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "center", gap: "2rem", marginBottom: "1rem" }}>
        <a href="/docs">Docs</a>
        <a href="https://github.com/agentgate/agentgate">GitHub</a>
        <a href="https://discord.gg/agentgate">Community</a>
      </div>
      <p>© 2026 AgentGate. Built on x402 + Base.</p>
    </footer>
  );
}
