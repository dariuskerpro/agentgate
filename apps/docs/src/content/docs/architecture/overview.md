---
sidebar:
  order: 1
title: Architecture Overview
description: How AgentGate's components fit together
---

AgentGate is a monorepo with five apps and four packages.

## System diagram

```
                          ┌──────────────────────┐
                          │     AI Agent / Dev    │
                          │  (buyer with wallet)  │
                          └──────────┬───────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
          ┌─────────────┐  ┌──────────────┐  ┌────────────┐
          │ Marketplace  │  │ Fulfillment  │  │    Web     │
          │     API      │  │     API      │  │            │
          │              │  │              │  │  Landing   │
          │  Discovery   │  │  Endpoints   │  │  page &    │
          │  Registry    │  │  behind x402 │  │  signup    │
          │  Analytics   │  │              │  │            │
          └──────────────┘  └──────┬───────┘  └────────────┘
                                   │
                                   │ verify payment
                                   ▼
                          ┌──────────────────┐
                          │   Facilitator    │
                          │                  │
                          │  On-chain USDC   │
                          │  verification    │
                          │  (Base + Solana) │
                          └──────────────────┘

          ┌──────────────────────────────────────────────┐
          │                  Packages                     │
          │                                              │
          │  @agent-gate/middleware  →  Express/Hono/Next │
          │  @agent-gate/sdk        →  TypeScript client  │
          │  @agent-gate/mcp        →  MCP server         │
          │  @agent-gate/cli        →  CLI tool            │
          └──────────────────────────────────────────────┘
```

## Components

### Marketplace API (`api.agentgate.online`)

The registry and discovery layer. Tracks sellers, endpoints, transactions, and health.

- **Routes:** `/v1/sellers`, `/v1/endpoints`, `/v1/discover`, `/v1/events`
- **Database:** PostgreSQL via Drizzle ORM
- **Auth:** API key for sellers, public access for discovery
- **Stack:** Hono on Node.js

### Fulfillment API (`fulfill.agentgate.online`)

Hosts the actual paid endpoints. Each request goes through x402 payment verification before reaching the handler.

- **11 live endpoints** across utility, data, AI inference, and document categories
- **x402 integration:** Uses `@x402/hono` middleware with `ExactEvmScheme` and `ExactSvmScheme`
- **Dual-chain:** Accepts USDC on Base mainnet and Solana mainnet
- **Stack:** Hono on Node.js

### Facilitator (`x402.org/facilitator`)

Verifies payments on-chain. When a buyer submits an `X-402-Payment` header, the facilitator:

1. Decodes the payment payload
2. Verifies the signature
3. Confirms the USDC transfer on-chain (Base or Solana)
4. Returns verification result to the fulfillment API

### Web (`agentgate.online`)

Landing page and seller onboarding. Built with Next.js.

### Dashboard

Seller portal for managing endpoints, viewing analytics, and tracking revenue.

## Payment flow

Here's the complete sequence for a paid API call:

```
Buyer                    Fulfillment API              Facilitator           Chain
  │                           │                           │                   │
  │  POST /v1/code-review     │                           │                   │
  │  (no payment header)      │                           │                   │
  │ ─────────────────────────▶│                           │                   │
  │                           │                           │                   │
  │  402 Payment Required     │                           │                   │
  │  {price, wallet, network} │                           │                   │
  │ ◀─────────────────────────│                           │                   │
  │                           │                           │                   │
  │  Sign USDC payment        │                           │                   │
  │  (client-side)            │                           │                   │
  │                           │                           │                   │
  │  POST /v1/code-review     │                           │                   │
  │  X-402-Payment: <signed>  │                           │                   │
  │ ─────────────────────────▶│                           │                   │
  │                           │  Verify payment           │                   │
  │                           │ ─────────────────────────▶│                   │
  │                           │                           │  Check on-chain   │
  │                           │                           │ ─────────────────▶│
  │                           │                           │                   │
  │                           │                           │  ✓ Confirmed      │
  │                           │                           │ ◀─────────────────│
  │                           │  ✓ Payment valid          │                   │
  │                           │ ◀─────────────────────────│                   │
  │                           │                           │                   │
  │  200 OK                   │                           │                   │
  │  {review results}         │                           │                   │
  │ ◀─────────────────────────│                           │                   │
```

## Packages

### @agent-gate/middleware

x402 payment middleware for Express, Hono, and Next.js. Sellers install this to monetize their own APIs.

- Export: `@agent-gate/middleware/express`
- Export: `@agent-gate/middleware/hono`
- Export: `@agent-gate/middleware/next`

### @agent-gate/sdk

TypeScript client for discovering and calling AgentGate endpoints.

```ts
import { AgentGateClient } from "@agent-gate/sdk";
const client = new AgentGateClient();
```

### @agent-gate/mcp

MCP server that exposes AgentGate tools to AI coding agents (Claude Code, Cursor, Windsurf).

```bash
npm install -g @agent-gate/mcp
```

### @agent-gate/cli

Command-line tool for interacting with AgentGate APIs.
