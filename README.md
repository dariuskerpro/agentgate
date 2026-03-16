# 🚪 AgentGate

**Shopify for the AI agent economy.** Middleware + marketplace that lets developers monetize APIs for AI agents via x402 stablecoin micropayments.

---

## The Problem

AI agents are about to outnumber humans in internet transactions. They can't use credit cards — no KYC, no bank accounts — so they need crypto-native payment rails. Coinbase's **x402 protocol** solves the *how* (stablecoins embedded in HTTP requests), but what's missing is the *what to buy* and the *easy on-ramp for sellers*.

**AgentGate** fills the gap:

1. **Middleware platform** — any developer can monetize their API for AI agents in under 5 minutes (drop-in x402 integration + analytics + pricing tools)
2. **Curated marketplace** — sits on top of x402's Bazaar, making it dead simple for AI agents to discover, compare, and pay for services

---

## Why Now

- McKinsey projects AI agents could mediate **$3–5 trillion** in global commerce by 2030
- x402 is live but doing ~$28K/day — the protocol exists, the merchants don't
- Cloudflare, Circle, AWS, Stripe, and Google are all backing x402
- Nobody is building the connective tissue between protocol and commerce — **we are**

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   AgentGate Platform                 │
├─────────────┬──────────────┬────────────────────────┤
│  Seller Hub │  Marketplace │  Agent SDK             │
│             │              │                        │
│ • Onboard   │ • Discovery  │ • Unified client       │
│ • Pricing   │ • Compare    │ • Wallet mgmt          │
│ • Analytics │ • Quality    │ • Spend policies       │
│ • Payouts   │ • Categories │ • Auto-discovery       │
├─────────────┴──────────────┴────────────────────────┤
│              AgentGate Middleware Layer               │
│  x402 integration · usage metering · rate limiting   │
│  quality scoring · uptime monitoring                 │
├──────────────────────────────────────────────────────┤
│              x402 Protocol (Coinbase)                │
│              Base / Polygon / Solana                 │
│              USDC / EURC / Any ERC-20               │
└──────────────────────────────────────────────────────┘
```

---

## Quick Start

```bash
npx agentgate init
```

Scans your project for API routes, auto-generates x402 middleware config, suggests pricing, and gets you listed on the marketplace.

**Supported frameworks:** Express.js · Next.js · Hono · FastAPI (coming)

---

## Repo Structure

```
agentgate/
├── packages/
│   ├── middleware-express/   # @agentgate/middleware-express
│   ├── middleware-hono/      # @agentgate/middleware-hono
│   ├── middleware-next/      # @agentgate/middleware-next
│   ├── cli/                  # npx agentgate init
│   ├── db/                   # Database schema (Drizzle ORM)
│   └── shared/               # Shared types & utilities
├── apps/
│   ├── marketplace-api/      # Discovery & catalog API
│   ├── dashboard/            # Seller analytics dashboard
│   └── web/                  # Landing page & docs
├── turbo.json
└── package.json
```

---

## Features

### Seller Hub
- **One-command onboarding** — `npx agentgate init` gets you listed in minutes
- **Pricing engine** — suggested pricing, dynamic pricing, A/B testing
- **Analytics dashboard** — real-time revenue, transaction count, top agents, performance metrics
- **Payout management** — auto-settlement to your wallet (USDC on Base)

### Marketplace
- **Curated catalog** — extends x402 Bazaar with rich metadata and categories
- **Quality signals** — uptime scores, latency percentiles, agent ratings, verified badges
- **Smart routing** — auto-selects the best provider by quality/price with failover

### Agent SDK *(coming Phase 2)*
- Unified client library for discovering and paying for services
- Wallet management with spend policies and budget controls
- Framework integrations: LangChain, CrewAI, MCP, OpenAI function calling

---

## Revenue Model

| Stream | Mechanism |
|--------|-----------|
| **Transaction fee** | 1% at launch → 2.5% at traction |
| **Premium seller tools** | $49–199/mo (advanced analytics, dynamic pricing, priority listing) |
| **Featured listings** | Promoted placement in marketplace |
| **Enterprise SDK** | Custom wallet management, compliance, SLAs |

---

## Competitive Position

| Player | Gap We Fill |
|--------|-------------|
| **x402 / Coinbase** | We make x402 *usable* — they're the protocol, we're the platform |
| **Bazaar** | Self-described "Yahoo search" — we're building Google |
| **Stripe** | Can't do sub-cent micropayments, not built for agents |
| **RapidAPI** | No crypto payments, no agent-native discovery |

---

## Development Phases

| Phase | Timeline | Focus |
|-------|----------|-------|
| **Phase 1** ✅ | Weeks 1–4 | Middleware + basic marketplace + CLI + landing page |
| **Phase 2** | Weeks 5–8 | Pricing engine, quality scoring, smart routing, Agent SDK v1 |
| **Phase 3** | Weeks 9–12 | LangChain/MCP/CrewAI integrations, dynamic pricing, reputation |
| **Phase 4** | Weeks 13–20 | Enterprise features, geographic routing, open-source middleware |

---

## Key Decisions

1. **No token at launch** — focus on product. Revisit at 1,000+ endpoints or $50K+ daily GMV.
2. **Open middleware, proprietary marketplace** — MIT for adoption, revenue from the platform.
3. **First vertical: Data APIs** — highest agent demand, simplest pricing model.
4. **1% take rate** → undercuts fast-followers, increases at traction.

---

## Tech Stack

- **Runtime:** Node.js (TypeScript)
- **Monorepo:** Turborepo + pnpm
- **Database:** PostgreSQL (Drizzle ORM) + Redis
- **Blockchain:** Base (primary), Polygon, Solana via x402
- **Auth:** Wallet-based (SIWE) for sellers, API keys + wallet for agents

---

## Links

- [x402 Documentation](https://docs.cdp.coinbase.com/x402/welcome)
- [x402 SDK](https://github.com/coinbase/x402)
- [x402 Bazaar](https://docs.cdp.coinbase.com/x402/bazaar)
- [Coinbase Developer Platform](https://cdp.coinbase.com)

---

## Status

**Phase 1 complete.** 190+ tests passing, 6 packages building, 29 commits. Ready for Phase 2.
