# AgentGate

**Monetize any API in 3 lines of code.**

Add [x402](https://x402.org) payments to your existing API. Your endpoints earn USDC from every agent call. No signup for buyers. No invoicing for sellers. Just HTTP + crypto.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![npm](https://img.shields.io/npm/v/@agent-gate/middleware)](https://www.npmjs.com/package/@agent-gate/middleware)

## How It Works

```
Agent Request → Your API → 402 Payment Required
                          ← x402 USDC payment header
Agent Retries → Your API → ✅ 200 OK (payment verified)
```

1. Agent calls your endpoint
2. x402 middleware returns `402 Payment Required` with pricing
3. Agent signs a USDC payment and retries
4. Middleware verifies payment, your handler runs, agent gets the response

## Quick Start

### For Sellers (Add Payments to Your API)

```bash
npm install @agent-gate/middleware
```

```typescript
import { Hono } from 'hono';
import { paymentMiddleware } from '@agent-gate/middleware/hono';

const app = new Hono();

// EVM wallet (Base) or Solana wallet — both accept USDC
app.use('/api/translate', paymentMiddleware({
  price: '$0.02',
  wallet: process.env.MY_WALLET,
}));

app.post('/api/translate', async (c) => {
  // Your existing handler — only runs after payment
  const { text, to } = await c.req.json();
  return c.json({ translated: await translate(text, to) });
});
```

Also works with **Express** and **Next.js**:

```typescript
// Express
import { agentgate } from '@agent-gate/middleware/express';
app.use('/api/translate', agentgate({ price: '$0.02', wallet }));

// Next.js
import { withAgentGate } from '@agent-gate/middleware/next';
export const POST = withAgentGate(handler, { price: '$0.02', wallet });
```

### For Buyers (Call AgentGate Endpoints)

```typescript
import { AgentGateClient } from '@agent-gate/sdk';

const client = new AgentGateClient();

// Discover endpoints
const { endpoints } = await client.discover('transcribe');

// Call an endpoint (handles 402 flow)
const result = await client.call('/v1/transcribe', { file: audioBlob });
```

### MCP Server (Claude Code / Cursor)

```bash
npx @agent-gate/mcp
```

Add to your MCP config to let AI agents discover and call AgentGate endpoints natively.

### Python

```bash
pip install agentgate
```

```python
from agentgate import AgentGateClient

client = AgentGateClient()
endpoints = client.discover("code review")
result = client.call("/v1/code-review", {"code": "def add(a, b): return a + b"})
```

## Live Endpoints

All endpoints accept USDC on **Base** and **Solana** via x402.

| Endpoint | Price | Description |
|----------|-------|-------------|
| `/v1/transcribe` | $0.015 | Audio → transcript with timestamps (Whisper) |
| `/v1/code-review` | $0.05 | Code → security, performance, architecture review (Claude) |
| `/v1/transcript-to-prd` | $0.035 | Meeting transcript → structured PRD (Claude) |
| `/v1/scrape-enrich` | $0.012 | URL → structured data with optional AI extraction |
| `/v1/pdf-extract` | $0.02 | PDF → text, tables, key-value pairs (Gemini) |
| `/v1/email-validate` | $0.0005 | Email → MX check, disposable detection, typo suggestions |
| `/v1/dns-lookup` | $0.0003 | Domain → A/AAAA/MX/NS/TXT/CNAME/SOA records |
| `/v1/url-metadata` | $0.0005 | URL → title, OG tags, Twitter cards, favicon |
| `/v1/phone-validate` | $0.0003 | Phone → E.164 format, country detection |
| `/v1/crypto-price` | $0.0001 | Crypto → price, 24h change, market cap |
| `/v1/ip-geolocate` | $0.0002 | IP → country, city, ISP, coordinates |

**Try it:**
```bash
curl -X POST https://fulfill.agentgate.online/v1/email-validate \
  -H "Content-Type: application/json" \
  -d '{"email": "test@gmail.com"}'
# Returns 402 — payment required via x402
```

## Packages

| Package | Description |
|---------|-------------|
| [`@agent-gate/middleware`](packages/middleware) | Express/Hono/Next.js x402 payment middleware |
| [`@agent-gate/sdk`](packages/sdk) | TypeScript client for discovery + calling |
| [`@agent-gate/mcp`](packages/mcp) | MCP server for Claude Code / Cursor integration |
| [`@agent-gate/cli`](packages/cli) | CLI for scaffolding AgentGate projects |
| [`agentgate`](packages/python) | Python SDK with LangChain + CrewAI integrations |

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Agent /    │────▶│  Marketplace API  │     │   Facilitator   │
│   Developer  │     │  (Discovery)      │     │  (Payment       │
│              │     │  api.agentgate.online  │     │   Verification) │
│              │     └──────────────────┘     └────────┬────────┘
│              │                                        │
│              │     ┌──────────────────┐              │
│              │────▶│  Fulfillment API  │◀─────────────┘
│              │     │  (Endpoints)      │
│              │     │  fulfill.agentgate│
│              │     └──────────────────┘
└─────────────┘
```

- **Marketplace API** — Endpoint discovery and search
- **Fulfillment API** — The actual AI endpoints behind x402 paywalls
- **Facilitator** — Self-hosted x402 payment verification (Base + Solana)
- **Web** — Landing page and marketplace browser

## Development

```bash
# Install dependencies
pnpm install

# Run all tests
pnpm test

# Build everything
pnpm build

# Dev mode
pnpm dev
```

## Networks

- **Base** (EVM, mainnet) — Primary
- **Solana** (mainnet) — Secondary
- Both accept **USDC** payments

## License

MIT — middleware, SDK, MCP, and CLI packages.
