# Pricing Guide

How to price your API endpoints on AgentGate.

## Pricing Model

AgentGate uses **per-request pricing** in USDC. Each time an AI agent calls your endpoint, they pay the exact amount you've configured. There are no monthly plans, no tiers — just pay-per-use.

Payments settle in USDC on Base (Ethereum L2), with negligible gas costs.

## Setting Prices

In your middleware config:

```typescript
routes: {
  'GET /api/weather': {
    price: '$0.001',  // $0.001 per request
  },
  'POST /api/analyze': {
    price: '$0.01',   // $0.01 per request
  },
}
```

## Category Benchmarks

Use these as starting points based on what similar endpoints charge:

| Category | Typical Price Range | Examples |
|----------|-------------------|----------|
| **Data** | $0.0005 – $0.005 | Weather, stock prices, geocoding |
| **Compute** | $0.005 – $0.05 | Web scraping, PDF conversion, image resize |
| **ML / AI** | $0.01 – $0.10 | Sentiment analysis, embeddings, classification |
| **Storage** | $0.001 – $0.01 | File upload, content hosting, caching |

## Pricing Strategy

### Start Low, Raise Later

New endpoints benefit from lower prices to attract initial traffic and build transaction history. Agents (and their operators) prefer endpoints with proven track records.

### Consider Your Costs

Factor in:
- **Compute cost** — what does it cost you to serve one request?
- **Data cost** — are you paying for upstream APIs or databases?
- **Value delivered** — how much is the output worth to the agent's task?

### Volume vs. Margin

- High-volume, low-cost data → price low ($0.0005–$0.002)
- Specialized, expensive compute → price higher ($0.01–$0.10)
- Unique data sources with no alternatives → premium pricing

## Monitoring Revenue

Track your pricing effectiveness in the [seller dashboard](https://agentgate.ai/dashboard):

- **Revenue per endpoint** — which endpoints earn the most
- **Transaction volume** — are agents using your endpoints consistently
- **Unique wallets** — how many distinct agents are paying

## Tips

1. **Check competitors** — Use `GET /v1/discover?category=data&sort=price` to see what others charge
2. **A/B test** — Register the same API at two price points on different URLs
3. **Bundle routes** — If an agent needs multiple calls, price accordingly
4. **Watch latency** — Faster responses justify higher prices (agents value speed)
