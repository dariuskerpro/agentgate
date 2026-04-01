# Architecture

How AgentGate works under the hood.

## Overview

AgentGate is **not a proxy**. It's a middleware layer + marketplace that connects API sellers with AI agent buyers. Payments flow directly between agents and sellers via the x402 protocol on Base (EVM) or Solana — both using USDC.

```
Agent (buyer)                    Developer (seller)
    │                                │
    │  1. Query marketplace          │  0. npx @dkerpal/agent-gate init
    ▼                                ▼
┌──────────────┐            ┌──────────────────┐
│ Marketplace  │            │ Seller's API     │
│ API          │◄───────────│ + @agent-gate/    │
│ (Hono on     │  register  │   middleware     │
│  Railway)    │            │                  │
└──────┬───────┘            └───────┬──────────┘
       │                            │
       │  2. Returns endpoint       │  3. Agent calls endpoint
       │     + pricing              │     → 402 Payment Required
       │                            │     → Agent signs USDC payment
       ▼                            ▼
   Agent calls  ──────────────►  Fulfillment API
   endpoint directly             (fulfill.agentgate.online)
                                     │
                                     ▼
                              x402 Facilitator
                              (self-hosted, Railway)
                                     │
                              ┌──────┴──────┐
                              ▼             ▼
                          Settlement     Settlement
                         (USDC on Base) (USDC on Solana)
```

## Components

### 1. Middleware (`@agent-gate/middleware`)

A lightweight wrapper around the x402 payment protocol. When installed in a seller's API:

- **Intercepts requests** to protected routes
- **Returns `402 Payment Required`** if no payment header is present, with a base64-encoded `payment-required` header containing pricing info
- **Validates payments** via the self-hosted x402 facilitator
- **Sends analytics** (async, non-blocking) to the AgentGate marketplace

The middleware never touches the money. It delegates payment validation to the self-hosted x402 facilitator and settlement happens on-chain (Base or Solana).

### 2. Marketplace API (`api.agentgate.online`)

A Hono application running on Railway. Responsibilities:

- **Seller registration** — wallet-based auth (SIWE)
- **Endpoint catalog** — CRUD for registered API endpoints
- **Discovery** — public search/browse for agents
- **Analytics ingestion** — records transaction events from middleware
- **Health monitoring** — periodic endpoint health checks

**Database:** PostgreSQL on Neon (serverless)
**Cache/Rate Limiting:** Upstash Redis

### 3. Fulfillment API (`fulfill.agentgate.online`)

A Hono application running on Railway. This is where the actual AI-powered endpoints live, behind x402 paywalls:

- **AI endpoints** — transcription (Whisper), code review (Claude), PDF extraction (Gemini), and more
- **x402 paywall** — every request requires USDC payment
- **Dual-chain** — accepts payments on both Base (EVM) and Solana

### 4. Facilitator (self-hosted)

An Express application running on Railway that handles x402 payment verification for both chains:

- **Base (EVM)** — verifies USDC payments on Base mainnet (`eip155:8453`)
- **Solana** — verifies USDC payments on Solana mainnet
- **v2 protocol** — uses `PAYMENT-SIGNATURE` header (replaces the older `X-PAYMENT` / `X-402-Payment` headers)

This is a self-hosted facilitator — not Coinbase CDP.

### 5. CLI (`npx @dkerpal/agent-gate init`)

Interactive setup wizard that:

1. Auto-detects the seller's framework
2. Registers them on the marketplace
3. Generates configuration
4. Installs the middleware package

### 6. Dashboard

Next.js application showing seller analytics:

- Revenue (total, 7d, 24h)
- Transaction history
- Per-endpoint breakdown
- Revenue-over-time chart

Auth via wallet connect (SIWE).

## Payment Flow (x402 v2)

The [x402 protocol](https://www.x402.org/) enables HTTP-native payments:

1. Agent sends request to endpoint (no payment header)
2. Middleware returns `402 Payment Required` with a base64-encoded `payment-required` header containing:
   - Price in USDC
   - Accepted networks (Base and/or Solana)
   - Facilitator URL
3. Agent signs a USDC payment on the chosen chain
4. Agent retries request with `PAYMENT-SIGNATURE` header (v2 protocol)
5. Facilitator verifies the payment on-chain
6. Request proceeds to the handler
7. USDC settles to seller's wallet on Base or Solana

**Key insight:** AgentGate is never in the payment path. USDC goes directly from agent to seller. We provide the discovery layer and tooling.

## Networks

Payments settle on **two chains**, both using USDC:

| Chain | Network ID | Currency | Status |
|-------|-----------|----------|--------|
| **Base** (Ethereum L2) | `eip155:8453` (mainnet) / `eip155:84532` (Sepolia testnet) | USDC | Primary |
| **Solana** | `solana:mainnet` | USDC | Secondary |

## Infrastructure

| Component | Hosting | Why |
|-----------|---------|-----|
| Marketplace API | Railway | Hono app, fast deploys |
| Fulfillment API | Railway | AI endpoints behind x402 |
| Facilitator | Railway | Self-hosted x402 payment verification |
| Database | Neon (PostgreSQL) | Serverless, scales to zero |
| Rate Limiting | Upstash Redis | Edge-compatible |
| Landing Page | Dedicated droplet | Static site on agentgate.online |
