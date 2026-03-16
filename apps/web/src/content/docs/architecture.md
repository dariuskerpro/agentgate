# Architecture

How AgentGate works under the hood.

## Overview

AgentGate is **not a proxy**. It's a middleware layer + marketplace that connects API sellers with AI agent buyers. Payments flow directly between agents and sellers via the x402 protocol on Base.

```
Agent (buyer)                    Developer (seller)
    │                                │
    │  1. Query marketplace          │  0. npx agent-gate init
    ▼                                ▼
┌──────────────┐            ┌──────────────────┐
│ Marketplace  │            │ Seller's API     │
│ API          │◄───────────│ + @agent-gate/    │
│ (Hono on CF) │  register  │   middleware     │
└──────┬───────┘            └───────┬──────────┘
       │                            │
       │  2. Returns endpoint       │  3. Agent calls endpoint
       │     + pricing              │     with x402 payment
       │                            │
       ▼                            ▼
   Agent calls  ──────────────►  x402 facilitator
   endpoint directly              (Coinbase CDP)
                                     │
                                     ▼
                                  Settlement
                                  (USDC on Base)
```

## Components

### 1. Middleware (`@agent-gate/middleware`)

A lightweight wrapper around the x402 payment protocol. When installed in a seller's API:

- **Intercepts requests** to protected routes
- **Returns `402 Payment Required`** if no payment header is present, along with pricing info
- **Validates payments** via the x402 facilitator
- **Sends analytics** (async, non-blocking) to the AgentGate marketplace

The middleware never touches the money. It delegates payment validation to the x402 facilitator (Coinbase CDP) and settlement happens on-chain.

### 2. Marketplace API

A Hono application running on Cloudflare Workers. Responsibilities:

- **Seller registration** — wallet-based auth (SIWE)
- **Endpoint catalog** — CRUD for registered API endpoints
- **Discovery** — public search/browse for agents
- **Analytics ingestion** — records transaction events from middleware
- **Health monitoring** — periodic endpoint health checks

**Database:** PostgreSQL on Neon (serverless)
**Cache/Rate Limiting:** Upstash Redis

### 3. CLI (`npx agent-gate init`)

Interactive setup wizard that:

1. Auto-detects the seller's framework
2. Registers them on the marketplace
3. Generates configuration
4. Installs the middleware package

### 4. Dashboard

Next.js application showing seller analytics:

- Revenue (total, 7d, 24h)
- Transaction history
- Per-endpoint breakdown
- Revenue-over-time chart

Auth via wallet connect (SIWE).

## Payment Flow (x402)

The [x402 protocol](https://www.x402.org/) enables HTTP-native payments:

1. Agent sends request to seller's API (no payment header)
2. Middleware returns `402 Payment Required` with:
   - Price in USDC
   - Network (Base)
   - Facilitator URL
3. Agent constructs payment via facilitator (Coinbase CDP)
4. Agent retries request with `X-402-Payment` header
5. Middleware validates payment through facilitator
6. Request proceeds to seller's handler
7. USDC settles to seller's wallet on Base

**Key insight:** AgentGate is never in the payment path. USDC goes directly from agent to seller. We provide the discovery layer and tooling.

## Network

All payments settle on **Base** (Ethereum L2):
- Network ID: `eip155:8453` (mainnet) / `eip155:84532` (Sepolia testnet)
- Currency: USDC
- Facilitator: Coinbase CDP

## Infrastructure

| Component | Hosting | Why |
|-----------|---------|-----|
| Marketplace API | Cloudflare Workers | Edge-deployed, fast globally |
| Database | Neon (PostgreSQL) | Serverless, scales to zero |
| Rate Limiting | Upstash Redis | Edge-compatible |
| Dashboard + Web | Vercel | Fast deploys, CDN |
| Health Cron | Cloudflare Workers | Cron triggers, no cold starts |
