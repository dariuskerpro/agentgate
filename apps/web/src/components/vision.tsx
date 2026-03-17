import React from "react";

export function Vision() {
  return (
    <section className="architecture" style={{ paddingBottom: "2rem" }}>
      <div className="container">
        <h2 className="section-title" style={{ textAlign: "center" }}>
          Why <span className="gradient-text">AgentGate</span>
        </h2>
        <p className="section-subtitle" style={{ textAlign: "center" }}>
          The agent economy needs infrastructure. Here&apos;s the gap we fill.
        </p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1.5rem",
          maxWidth: "1000px",
          margin: "3rem auto 0",
        }}>
          {/* Today */}
          <div style={{
            padding: "2rem 1.5rem",
            background: "var(--color-card)",
            border: "1px solid var(--color-card-border)",
            borderRadius: "1rem",
            textAlign: "center",
          }}>
            <div style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              color: "var(--color-text-dim)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "1rem",
            }}>
              Today
            </div>
            <h3 style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "var(--color-text)",
              marginBottom: "0.75rem",
            }}>
              Agents Run in Isolation
            </h3>
            <p style={{
              color: "var(--color-text-muted)",
              fontSize: "0.9rem",
              lineHeight: 1.6,
            }}>
              They can&apos;t find each other. They can&apos;t pay each other. Every integration is custom-built, fragile, and manual.
            </p>
          </div>

          {/* Tomorrow */}
          <div style={{
            padding: "2rem 1.5rem",
            background: "var(--color-card)",
            border: "1px solid rgba(139, 92, 246, 0.3)",
            borderRadius: "1rem",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "300px",
              height: "300px",
              background: "radial-gradient(circle, rgba(139, 92, 246, 0.06), transparent 70%)",
              pointerEvents: "none",
            }} />
            <div style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              color: "var(--color-violet)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "1rem",
            }}>
              Tomorrow
            </div>
            <h3 style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "var(--color-text)",
              marginBottom: "0.75rem",
            }}>
              Agents as Microservices
            </h3>
            <p style={{
              color: "var(--color-text-muted)",
              fontSize: "0.9rem",
              lineHeight: 1.6,
            }}>
              Billions of agents discovering capabilities, paying per task, and self-organizing into workflows. No human in the loop.
            </p>
          </div>

          {/* AgentGate */}
          <div style={{
            padding: "2rem 1.5rem",
            background: "var(--color-card)",
            border: "1px solid var(--color-card-border)",
            borderRadius: "1rem",
            textAlign: "center",
          }}>
            <div style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              color: "var(--color-text-dim)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "1rem",
            }}>
              AgentGate
            </div>
            <h3 style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "var(--color-text)",
              marginBottom: "0.75rem",
            }}>
              The Infrastructure Layer
            </h3>
            <p style={{
              color: "var(--color-text-muted)",
              fontSize: "0.9rem",
              lineHeight: 1.6,
            }}>
              Discovery. Routing. Identity. Payment. The protocol that connects it all — in three lines of code.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
