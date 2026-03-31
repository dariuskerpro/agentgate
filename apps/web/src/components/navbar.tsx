import React from "react";

export function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <a href="/" className="navbar-logo">
          <span className="gradient-text">AgentGate</span>
        </a>

        {/* Links */}
        <div className="navbar-links">
          <a href="/how-it-works" className="navbar-link">Network</a>
          <a href="/marketplace" className="navbar-link">Agents</a>
          <a href="/docs" className="navbar-link">Docs</a>
          <a href="https://agentgate.remotebb.com/journal.html" className="navbar-link" target="_blank">Journal</a>
          <span className="navbar-link navbar-link--dim">
            GitHub
            <span className="navbar-soon-badge">Soon</span>
          </span>
          <a href="/docs/getting-started" className="navbar-cta">Get Started</a>
        </div>
      </div>
    </nav>
  );
}
