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
          routing, identity, and payment settlement.
        </p>

        <div style={{ maxWidth: "900px", margin: "3rem auto 0" }}>
          <svg
            viewBox="0 0 900 400"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: "100%", height: "auto" }}
          >
            <defs>
              <linearGradient id="agGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
              <linearGradient id="flowGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.6" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Left: Agent A */}
            <rect x="20" y="130" width="180" height="140" rx="12" fill="rgba(139,92,246,0.08)" stroke="rgba(139,92,246,0.3)" strokeWidth="1" />
            <text x="110" y="170" textAnchor="middle" fill="#e2e8f0" fontSize="15" fontWeight="700" fontFamily="Inter, sans-serif">Agent A</text>
            <text x="110" y="192" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="Inter, sans-serif">Consumer</text>
            <line x1="60" y1="208" x2="160" y2="208" stroke="rgba(139,92,246,0.2)" strokeWidth="1" />
            <text x="110" y="230" textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="JetBrains Mono, monospace">LangChain</text>
            <text x="110" y="248" textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="JetBrains Mono, monospace">CrewAI / Custom</text>

            {/* Right: Agent B */}
            <rect x="700" y="130" width="180" height="140" rx="12" fill="rgba(139,92,246,0.08)" stroke="rgba(139,92,246,0.3)" strokeWidth="1" />
            <text x="790" y="170" textAnchor="middle" fill="#e2e8f0" fontSize="15" fontWeight="700" fontFamily="Inter, sans-serif">Agent B</text>
            <text x="790" y="192" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="Inter, sans-serif">Provider</text>
            <line x1="740" y1="208" x2="840" y2="208" stroke="rgba(139,92,246,0.2)" strokeWidth="1" />
            <text x="790" y="230" textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="JetBrains Mono, monospace">REST / GraphQL</text>
            <text x="790" y="248" textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="JetBrains Mono, monospace">Any API / Agent</text>

            {/* Center: AgentGate hub */}
            <rect x="300" y="90" width="300" height="220" rx="16" fill="rgba(139,92,246,0.06)" stroke="url(#agGrad)" strokeWidth="1.5" filter="url(#glow)" />
            <text x="450" y="125" textAnchor="middle" fill="url(#agGrad)" fontSize="18" fontWeight="800" fontFamily="Inter, sans-serif">AgentGate</text>

            {/* 4 capabilities in 2x2 grid */}
            {/* Discover */}
            <rect x="320" y="145" width="120" height="44" rx="8" fill="rgba(139,92,246,0.12)" stroke="rgba(139,92,246,0.25)" strokeWidth="1" />
            <text x="380" y="172" textAnchor="middle" fill="#c4b5fd" fontSize="12" fontWeight="600" fontFamily="Inter, sans-serif">🔍 Discover</text>

            {/* Route */}
            <rect x="460" y="145" width="120" height="44" rx="8" fill="rgba(139,92,246,0.12)" stroke="rgba(139,92,246,0.25)" strokeWidth="1" />
            <text x="520" y="172" textAnchor="middle" fill="#c4b5fd" fontSize="12" fontWeight="600" fontFamily="Inter, sans-serif">🔀 Route</text>

            {/* Identity */}
            <rect x="320" y="205" width="120" height="44" rx="8" fill="rgba(139,92,246,0.12)" stroke="rgba(139,92,246,0.25)" strokeWidth="1" />
            <text x="380" y="232" textAnchor="middle" fill="#c4b5fd" fontSize="12" fontWeight="600" fontFamily="Inter, sans-serif">🔐 Identity</text>

            {/* Payment */}
            <rect x="460" y="205" width="120" height="44" rx="8" fill="rgba(139,92,246,0.12)" stroke="rgba(139,92,246,0.25)" strokeWidth="1" />
            <text x="520" y="232" textAnchor="middle" fill="#c4b5fd" fontSize="12" fontWeight="600" fontFamily="Inter, sans-serif">💰 Payment</text>

            {/* Protocol label */}
            <text x="450" y="280" textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="JetBrains Mono, monospace">x402 Protocol · USDC on Base &amp; Solana</text>

            {/* Flow arrows: left → center */}
            <line x1="200" y1="175" x2="298" y2="175" stroke="url(#flowGrad)" strokeWidth="1.5" markerEnd="url(#arrowRight)" />
            <line x1="200" y1="200" x2="298" y2="200" stroke="url(#flowGrad)" strokeWidth="1.5" />
            <line x1="200" y1="225" x2="298" y2="225" stroke="url(#flowGrad)" strokeWidth="1.5" />

            {/* Flow arrows: center → right */}
            <line x1="602" y1="175" x2="700" y2="175" stroke="url(#flowGrad)" strokeWidth="1.5" />
            <line x1="602" y1="200" x2="700" y2="200" stroke="url(#flowGrad)" strokeWidth="1.5" />
            <line x1="602" y1="225" x2="700" y2="225" stroke="url(#flowGrad)" strokeWidth="1.5" />

            {/* Arrow heads */}
            <polygon points="296,170 306,175 296,180" fill="rgba(139,92,246,0.6)" />
            <polygon points="296,195 306,200 296,205" fill="rgba(139,92,246,0.6)" />
            <polygon points="296,220 306,225 296,230" fill="rgba(139,92,246,0.6)" />
            <polygon points="698,170 708,175 698,180" fill="rgba(139,92,246,0.6)" />
            <polygon points="698,195 708,200 698,205" fill="rgba(139,92,246,0.6)" />
            <polygon points="698,220 708,225 698,230" fill="rgba(139,92,246,0.6)" />

            {/* Flow steps at bottom */}
            <text x="175" y="355" textAnchor="middle" fill="#c4b5fd" fontSize="11" fontWeight="600" fontFamily="Inter, sans-serif">① Discover</text>
            <text x="350" y="355" textAnchor="middle" fill="#c4b5fd" fontSize="11" fontWeight="600" fontFamily="Inter, sans-serif">② Route</text>
            <text x="550" y="355" textAnchor="middle" fill="#c4b5fd" fontSize="11" fontWeight="600" fontFamily="Inter, sans-serif">③ Execute</text>
            <text x="725" y="355" textAnchor="middle" fill="#c4b5fd" fontSize="11" fontWeight="600" fontFamily="Inter, sans-serif">④ Settle</text>

            {/* Flow step connecting line */}
            <line x1="220" y1="352" x2="310" y2="352" stroke="rgba(139,92,246,0.3)" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="395" y1="352" x2="505" y2="352" stroke="rgba(139,92,246,0.3)" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="595" y1="352" x2="685" y2="352" stroke="rgba(139,92,246,0.3)" strokeWidth="1" strokeDasharray="4 4" />
          </svg>
        </div>
      </div>
    </section>
  );
}
