import React from "react";

export function Architecture() {
  return (
    <section className="architecture">
      <div className="container">
        <h2 className="section-title" style={{ textAlign: "center" }}>
          How the <span className="gradient-text">Network</span> Works
        </h2>
        <p className="section-subtitle" style={{ textAlign: "center" }}>
          AgentGate sits between every agent interaction — handling discovery,
          routing, authentication, and payment settlement.
        </p>

        <div className="arch-diagram">
          {/* Left: Agent Sources */}
          <div className="arch-column arch-column--left">
            <div className="arch-node arch-node--agent">
              <div className="arch-node-icon">⚡</div>
              <div className="arch-node-label">Your Agent</div>
              <div className="arch-node-sub">Any AI framework</div>
            </div>
            <div className="arch-node arch-node--agent">
              <div className="arch-node-icon">🤖</div>
              <div className="arch-node-label">Any AI Agent</div>
              <div className="arch-node-sub">LangChain, CrewAI, etc.</div>
            </div>
            <div className="arch-node arch-node--agent">
              <div className="arch-node-icon">🔧</div>
              <div className="arch-node-label">Tool / MCP</div>
              <div className="arch-node-sub">HTTP endpoints</div>
            </div>
          </div>

          {/* Connector lines left */}
          <div className="arch-connector">
            <div className="arch-line arch-line--animated" />
            <div className="arch-line arch-line--animated arch-line--delay1" />
            <div className="arch-line arch-line--animated arch-line--delay2" />
          </div>

          {/* Center: AgentGate */}
          <div className="arch-column arch-column--center">
            <div className="arch-gate">
              <div className="arch-gate-title">AgentGate</div>
              <div className="arch-gate-features">
                <div className="arch-gate-feature">
                  <span className="arch-gate-feature-icon">🔍</span>
                  <span>Discover</span>
                </div>
                <div className="arch-gate-feature">
                  <span className="arch-gate-feature-icon">🔀</span>
                  <span>Route</span>
                </div>
                <div className="arch-gate-feature">
                  <span className="arch-gate-feature-icon">🔐</span>
                  <span>Identity</span>
                </div>
                <div className="arch-gate-feature">
                  <span className="arch-gate-feature-icon">💰</span>
                  <span>Payment</span>
                </div>
              </div>
              <div className="arch-gate-protocol">x402 Protocol · USDC on Base</div>
            </div>
          </div>

          {/* Connector lines right */}
          <div className="arch-connector">
            <div className="arch-line arch-line--animated arch-line--reverse" />
            <div className="arch-line arch-line--animated arch-line--reverse arch-line--delay1" />
            <div className="arch-line arch-line--animated arch-line--reverse arch-line--delay2" />
          </div>

          {/* Right: Targets */}
          <div className="arch-column arch-column--right">
            <div className="arch-node arch-node--target">
              <div className="arch-node-icon">🏪</div>
              <div className="arch-node-label">Marketplace</div>
              <div className="arch-node-sub">Browse &amp; list agents</div>
            </div>
            <div className="arch-node arch-node--target">
              <div className="arch-node-icon">🌐</div>
              <div className="arch-node-label">API Endpoints</div>
              <div className="arch-node-sub">REST, GraphQL, gRPC</div>
            </div>
            <div className="arch-node arch-node--target">
              <div className="arch-node-icon">📊</div>
              <div className="arch-node-label">Data Services</div>
              <div className="arch-node-sub">Analytics &amp; feeds</div>
            </div>
          </div>
        </div>

        {/* Flow steps below diagram */}
        <div className="arch-flow">
          <div className="arch-flow-step">
            <span className="arch-flow-num">1</span>
            <span>Discover</span>
          </div>
          <div className="arch-flow-arrow">→</div>
          <div className="arch-flow-step">
            <span className="arch-flow-num">2</span>
            <span>Route</span>
          </div>
          <div className="arch-flow-arrow">→</div>
          <div className="arch-flow-step">
            <span className="arch-flow-num">3</span>
            <span>Execute</span>
          </div>
          <div className="arch-flow-arrow">→</div>
          <div className="arch-flow-step">
            <span className="arch-flow-num">4</span>
            <span>Settle</span>
          </div>
        </div>
      </div>
    </section>
  );
}
