# FAQ

## General

### What is AgentGate?

AgentGate is a middleware and marketplace that lets API developers monetize their endpoints for AI agent traffic. Agents pay per-request in USDC on Base via the x402 protocol.

### How is this different from a regular API marketplace?

AgentGate is built specifically for the agent economy. Payments are programmatic (no credit cards, no subscriptions), discovery is API-first (agents query it directly), and settlement is instant on-chain.

### Do I need crypto experience?

You need an Ethereum wallet address to receive payments. That's it. The middleware handles all the x402 payment protocol complexity.

## For Sellers

### How do I get started?

Run `npx agentgate init` in your project directory. The CLI walks you through setup in under 5 minutes.

### Which frameworks are supported?

- Express
- Hono (including Cloudflare Workers)
- Next.js (App Router)

More frameworks coming soon.

### How do I receive payments?

USDC settles directly to your wallet on Base (Ethereum L2). AgentGate is never in the payment path — agents pay you directly.

### How do I price my endpoints?

See the [Pricing Guide](./pricing-guide.md). Short version: data endpoints typically charge $0.001–$0.005, compute endpoints $0.005–$0.05, ML endpoints $0.01–$0.10.

### What does AgentGate charge?

Phase 1: Nothing. AgentGate takes no fees. We plan to introduce a small marketplace fee in the future, but for now it's free.

### What if the marketplace goes down?

Your middleware continues to process x402 payments. The marketplace handles discovery and analytics only — it never blocks payment flow. This is a core design principle.

## For Agents

### How do I find APIs?

Use the Discovery API:

```bash
curl "https://api.agentgate.ai/v1/discover?category=data&q=weather"
```

See the [Discovery API Reference](./discovery-api.md) for full details.

### How do I pay for an API call?

1. Call the endpoint — you'll get a `402 Payment Required` response with pricing info
2. Construct a payment via the x402 facilitator (Coinbase CDP)
3. Retry the request with the `X-402-Payment` header
4. Receive the response

### What currency is used?

USDC on Base (Ethereum L2). Gas costs are negligible.

### Do I need an API key?

No. Discovery endpoints are public. Payments are wallet-to-wallet via x402.

## Technical

### What is x402?

[x402](https://www.x402.org/) is an open protocol for HTTP-native payments. It uses the HTTP 402 status code ("Payment Required") to enable programmatic per-request payments. AgentGate builds on x402 with Coinbase CDP as the facilitator.

### What blockchain is used?

Base (Ethereum L2). Network ID: `eip155:8453` for mainnet, `eip155:84532` for Sepolia testnet.

### Is the middleware open source?

Yes. `@agentgate/middleware` is MIT licensed. The marketplace API and dashboard are proprietary.

### How does health monitoring work?

AgentGate pings every active endpoint every 5 minutes. Health data (uptime, latency) is shown in discovery results so agents can choose reliable APIs.
