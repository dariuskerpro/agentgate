# FAQ

## General

### What is AgentGate?

AgentGate is an x402 middleware and marketplace that lets API developers monetize their endpoints for AI agent traffic. Agents pay per-request in USDC via the x402 protocol — no accounts, no API keys, just wallet-to-wallet payments.

### How is this different from a regular API marketplace?

AgentGate is built specifically for the agent economy. Payments are programmatic (no credit cards, no subscriptions), discovery is API-first (agents query it directly), and settlement is instant on-chain. Both Base (EVM) and Solana are supported.

### Do I need crypto experience?

You need a wallet address to receive payments — either an EVM wallet (for Base) or a Solana wallet. That's it. The middleware handles all the x402 payment protocol complexity.

### What chains are supported?

AgentGate supports two chains, both using USDC:

- **Base** (Ethereum L2) — Network ID: `eip155:8453` (mainnet), `eip155:84532` (Sepolia testnet)
- **Solana** — Network ID: `solana:mainnet`

Agents can pay on either chain. As a seller, you choose which chain(s) to accept when you configure your middleware.

## For Sellers

### How do I get started?

Run `npx @dkerpal/agent-gate init` in your project directory. The CLI walks you through setup in under 5 minutes.

### Which frameworks are supported?

- Express
- Hono (including Cloudflare Workers)
- Next.js (App Router)

More frameworks coming soon.

### How do I receive payments?

USDC settles directly to your wallet on Base or Solana. AgentGate is never in the payment path — agents pay you directly.

### How do I price my endpoints?

See the [Pricing Guide](./pricing-guide.md). Short version: simple lookups/validations run $0.0001–$0.001, compute endpoints $0.005–$0.05, AI-powered endpoints $0.015–$0.10.

### What does AgentGate charge?

Phase 1: Nothing. AgentGate takes no fees. We plan to introduce a small marketplace fee in the future, but for now it's free.

### What if the marketplace goes down?

Your middleware continues to process x402 payments. The marketplace handles discovery and analytics only — it never blocks payment flow. This is a core design principle.

## For Agents (Buyers)

### How do I find APIs?

Use the Discovery API:

```bash
curl "https://api.agentgate.online/v1/discover?category=data&q=weather"
```

See the [Discovery API Reference](./discovery-api.md) for full details.

### How does the x402 payment flow work?

1. Call the endpoint — you get a `402 Payment Required` response with a base64-encoded `payment-required` header
2. Read the header to get the price, accepted networks, and facilitator URL
3. Sign a USDC payment on Base or Solana
4. Retry the request with the `PAYMENT-SIGNATURE` header
5. Receive the `200 OK` response with your result

The `@agent-gate/sdk` and Python `agentgate` package handle this flow automatically.

### What's the PAYMENT-SIGNATURE header?

This is the v2 x402 protocol header. Your agent signs a USDC payment and includes the base64-encoded signature in the `PAYMENT-SIGNATURE` header when retrying the request. The facilitator verifies this signature before the endpoint serves the response.

### What happened to the X-PAYMENT / X-402-Payment header?

The v1 protocol used `X-PAYMENT` and `X-402-Payment` headers. The v2 protocol standardized on `PAYMENT-SIGNATURE`. If you're using the latest SDK or middleware, this is handled automatically.

### What currency is used?

USDC on Base (Ethereum L2) or Solana. Gas costs are negligible on both chains.

### Do I need an API key?

No. Discovery endpoints are public. Payments are wallet-to-wallet via x402. No account required.

### Can I test without real money?

Yes. For Base, you can use the Sepolia testnet (`eip155:84532`) with testnet USDC. For Solana, devnet is available. Configure your middleware or SDK with the testnet network ID to test the full payment flow without spending real funds.

## Technical

### What is x402?

[x402](https://www.x402.org/) is an open protocol for HTTP-native payments. It uses the HTTP 402 status code ("Payment Required") to enable programmatic per-request payments. AgentGate uses a self-hosted x402 facilitator that supports both Base and Solana.

### What blockchains are used?

- **Base** (Ethereum L2) — Network ID: `eip155:8453` for mainnet, `eip155:84532` for Sepolia testnet
- **Solana** — Network ID: `solana:mainnet`

Both chains settle in USDC.

### Is the middleware open source?

Yes. `@agent-gate/middleware` is MIT licensed. The marketplace API and dashboard are proprietary.

### How does health monitoring work?

AgentGate pings every active endpoint every 5 minutes. Health data (uptime, latency) is shown in discovery results so agents can choose reliable APIs.
