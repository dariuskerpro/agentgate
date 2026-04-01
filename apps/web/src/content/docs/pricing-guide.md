# Pricing Guide

How to price your API endpoints on AgentGate.

## Pricing Model

AgentGate uses **per-request pricing** in USDC. Each time an AI agent calls your endpoint, they pay the exact amount you've configured. There are no monthly plans, no tiers — just pay-per-use.

Payments settle in USDC on Base (Ethereum L2) or Solana, with negligible gas costs on both chains.

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
| **Data** | $0.0001 – $0.005 | DNS lookup, crypto prices, IP geolocation |
| **Validation** | $0.0003 – $0.001 | Email validation, phone validation, URL metadata |
| **Compute** | $0.005 – $0.05 | Web scraping, PDF extraction |
| **ML / AI** | $0.015 – $0.10 | Transcription, code review, PRD generation |

## Live Pricing Examples

These are real prices from live AgentGate endpoints on `fulfill.agentgate.online`:

| Endpoint | Price | What It Does |
|----------|-------|-------------|
| `/v1/crypto-price` | $0.0001 | Crypto price + 24h change + market cap |
| `/v1/ip-geolocate` | $0.0002 | IP → country, city, ISP, coordinates |
| `/v1/dns-lookup` | $0.0003 | Domain → A/AAAA/MX/NS/TXT/CNAME/SOA records |
| `/v1/phone-validate` | $0.0003 | Phone → E.164 format, country detection |
| `/v1/email-validate` | $0.0005 | Email → MX check, disposable detection |
| `/v1/url-metadata` | $0.0005 | URL → title, OG tags, Twitter cards |
| `/v1/scrape-enrich` | $0.012 | URL → structured data with AI extraction |
| `/v1/transcribe` | $0.015 | Audio → transcript with timestamps (Whisper) |
| `/v1/pdf-extract` | $0.02 | PDF → text, tables, key-value pairs (Gemini) |
| `/v1/transcript-to-prd` | $0.035 | Meeting transcript → structured PRD (Claude Sonnet 4) |
| `/v1/code-review` | $0.05 | Code → security, performance, architecture review (Claude Sonnet 4) |

**Pattern:** Simple lookups/validations run $0.0001–$0.001. Compute-heavy tasks run $0.01–$0.02. AI-powered endpoints with LLM calls run $0.015–$0.05.

## Pricing Strategy

### Start Low, Raise Later

New endpoints benefit from lower prices to attract initial traffic and build transaction history. Agents (and their operators) prefer endpoints with proven track records.

### Consider Your Costs

Factor in:
- **Compute cost** — what does it cost you to serve one request?
- **Data cost** — are you paying for upstream APIs or databases?
- **Value delivered** — how much is the output worth to the agent's task?

### Volume vs. Margin

- High-volume, low-cost data → price low ($0.0001–$0.002)
- Specialized, expensive compute → price higher ($0.01–$0.05)
- AI-powered endpoints with LLM costs → price to cover model cost + margin ($0.015–$0.10)
- Unique data sources with no alternatives → premium pricing

## Monitoring Revenue

Track your pricing effectiveness in the [seller dashboard](https://agentgate.online/dashboard):

- **Revenue per endpoint** — which endpoints earn the most
- **Transaction volume** — are agents using your endpoints consistently
- **Unique wallets** — how many distinct agents are paying

## Tips

1. **Check competitors** — Use `GET /v1/discover?category=data&sort=price` to see what others charge
2. **A/B test** — Register the same API at two price points on different URLs
3. **Bundle routes** — If an agent needs multiple calls, price accordingly
4. **Watch latency** — Faster responses justify higher prices (agents value speed)
