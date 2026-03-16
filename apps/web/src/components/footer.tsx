import React from "react";

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          AgentGate
          <span>&copy; 2026 &middot; Infrastructure for the Agent Economy</span>
        </div>
        <nav className="footer-links">
          <a href="/docs">Docs</a>
          <a href="/marketplace">Marketplace</a>
          <span style={{ color: "var(--color-text-dim)", cursor: "default" }}>
            GitHub (Coming Soon)
          </span>
          <a
            href="https://discord.gg/agentgate"
            target="_blank"
            rel="noopener noreferrer"
          >
            Discord
          </a>
        </nav>
      </div>
    </footer>
  );
}
