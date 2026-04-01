---
sidebar:
  order: 1
title: Introduction
description: What AgentGate is and how it works
---

AgentGate is x402 middleware and a marketplace for pay-per-call APIs. Sellers add three lines of code to monetize any endpoint with USDC payments. Buyers call endpoints directly — no signup, no API keys, no subscriptions.

## How it works

1. **Buyer** sends a request to a paid endpoint
2. **Server** returns HTTP `402 Payment Required` with price + wallet details
3. **Buyer's agent** signs a USDC payment and retries with the `X-402-Payment` header
4. **Facilitator** verifies the payment on-chain
5. **Server** processes the request and returns the result

The entire flow happens in a single round-trip from the buyer's perspective (the SDK handles the 402 → pay → retry automatically).

## Architecture

AgentGate has four main components:

```
┌─────────────┐     ┌──────────────────┐     ┌───────────────┐
│  Marketplace │     │  Fulfillment API  │     │  Facilitator  │
│     API      │     │                  │     │               │
│              │     │  Your endpoints  │     │  Verifies     │
│  Discovery   │────▶│  behind x402     │◀───▶│  payments     │
│  & registry  │     │  paywall         │     │  on-chain     │
└──────────────┘     └──────────────────┘     └───────────────┘
        │                                            │
        │            ┌──────────────────┐            │
        └───────────▶│   Web + Dashboard │◀──────────┘
                     │   Seller portal   │
                     └──────────────────┘
```

| Component | URL | Purpose |
|-----------|-----|---------|
| Marketplace API | `api.agentgate.online` | Endpoint discovery, seller registration, analytics |
| Fulfillment API | `fulfill.agentgate.online` | Hosts the actual endpoints behind x402 paywalls |
| Facilitator | `x402.org/facilitator` | Verifies and settles USDC payments on-chain |
| Web | `agentgate.online` | Landing page and seller dashboard |

## Key concepts

**x402 Protocol** — An open standard that extends HTTP with native payments. Any HTTP client that understands `402 Payment Required` can pay for API calls. See [x402 Protocol](/architecture/x402) for details.

**USDC payments** — All payments are in USDC stablecoins on Base (EVM) or Solana mainnet. No volatile tokens, no gas surprises for sellers.

**No signup for buyers** — Buyers never create accounts. They just need a wallet with USDC. The payment header *is* the authentication.

**3 lines of code for sellers** — Install the middleware, configure your wallet and prices, deploy. That's it. See [Quickstart for Sellers](/getting-started/sellers).

## What you can build

- **Monetize your existing API** — Add x402 to any Express, Hono, or Next.js app
- **Sell AI inference** — Wrap any model behind a paid endpoint
- **Build data pipelines** — Chain multiple paid endpoints together
- **Agent tooling** — Let AI agents pay for the tools they need

## Next steps

- [Quickstart for Sellers](/getting-started/sellers) — Monetize your API in 5 minutes
- [Quickstart for Buyers](/getting-started/buyers) — Call paid endpoints from code or CLI
- [Live Endpoints](/api/endpoints) — Browse available endpoints
