# 🚪 AgentGate

**Shopify for the AI agent economy.** Middleware + marketplace that lets developers monetize APIs for AI agents via x402 stablecoin micropayments.

## What's in this folder

| File | What it is |
|------|-----------|
| `PRD.md` | Full product requirements document — strategy, architecture, revenue model, competitive landscape, decisions |
| `PHASE1-SPEC.md` | Phase 1 technical spec — 14 detailed build tickets, database schema, API specs, deployment pipeline, week-by-week plan |
| `README.md` | You're here |

## Quick Context

- **x402** is Coinbase's open protocol for stablecoin payments over HTTP. Backed by Cloudflare, Circle, AWS, Stripe, Google.
- **The gap:** Protocol exists, merchants don't. Nobody is building the middleware/marketplace layer.
- **AgentGate** makes it dead simple to monetize an API for agents (seller) and discover/pay for services (agent buyer).
- **Revenue:** 1% transaction fee (→ 2.5% at traction) + SaaS for seller tools.

## Decisions (Locked)

1. **Name:** AgentGate
2. **Token:** No token at launch. Future possibility.
3. **Open source:** Middleware = MIT open source. Marketplace = proprietary.
4. **First vertical:** Data APIs
5. **Take rate:** 1% → 2.5%

## Key Links

- x402 docs: https://docs.cdp.coinbase.com/x402/welcome
- x402 SDK repo: https://github.com/coinbase/x402
- x402 Bazaar: https://docs.cdp.coinbase.com/x402/bazaar
- CDP signup: https://cdp.coinbase.com

## Phase 1 Target

**4 weeks → developer can list a monetized API endpoint in under 5 minutes, agents discover and pay for it via USDC on Base.**

Start with ticket AG-001 (project scaffolding) and work sequentially.

## Questions?

Raise questions in the project group chat.
