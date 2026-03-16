import React from "react";

export function Navbar() {
  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: "rgba(9, 9, 11, 0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--color-card-border)",
      }}
    >
      <div
        style={{
          maxWidth: "var(--max-width)",
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.75rem 1.5rem",
        }}
      >
        {/* Logo */}
        <a
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            textDecoration: "none",
          }}
        >
          <span
            style={{
              fontSize: "1.125rem",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              background:
                "linear-gradient(135deg, var(--color-violet), var(--color-indigo))",
              WebkitTextFillColor: "transparent",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
            }}
          >
            AgentGate
          </span>
        </a>

        {/* Links */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1.75rem",
          }}
        >
          <a
            href="/marketplace"
            style={{
              color: "var(--color-text-muted)",
              fontSize: "0.875rem",
              fontWeight: 500,
              textDecoration: "none",
              transition: "color 0.15s",
            }}
          >
            Marketplace
          </a>
          <a
            href="/docs"
            style={{
              color: "var(--color-text-muted)",
              fontSize: "0.875rem",
              fontWeight: 500,
              textDecoration: "none",
              transition: "color 0.15s",
            }}
          >
            Docs
          </a>
          <a
            href="https://github.com/dariuskerpro/agentgate"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "var(--color-text-dim)",
              fontSize: "0.875rem",
              fontWeight: 500,
              textDecoration: "none",
              transition: "color 0.15s",
            }}
          >
            GitHub
          </a>
          <a
            href="/docs/getting-started"
            style={{
              background:
                "linear-gradient(135deg, var(--color-violet), var(--color-indigo))",
              color: "#fff",
              fontSize: "0.8125rem",
              fontWeight: 600,
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              textDecoration: "none",
              transition: "opacity 0.15s",
            }}
          >
            Get Started
          </a>
        </div>
      </div>
    </nav>
  );
}
