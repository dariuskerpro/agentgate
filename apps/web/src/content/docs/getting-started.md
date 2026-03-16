# Getting Started with AgentGate

Monetize your API for AI agents in under 5 minutes.

## Prerequisites

- Node.js 18+ installed
- An Ethereum wallet address (to receive USDC payments)
- An existing API project (Express, Hono, or Next.js)

## Quick Start

### 1. Initialize AgentGate

Run the setup wizard in your project directory:

```bash
npx agent-gate init
```

The CLI will:
- Auto-detect your framework (Express, Hono, Next.js)
- Ask for your wallet address
- Register you on the AgentGate marketplace
- Generate a `.agentgate.json` config file

### 2. Add the Middleware

**Express:**

```typescript
import express from 'express';
import { agentgate } from '@agentgate/middleware/express';

const app = express();

app.use(agentgate({
  wallet: '0xYourWallet',
  routes: {
    'GET /api/weather': {
      price: '$0.001',
      description: 'Current weather data',
      category: 'data',
    },
  },
}));

app.get('/api/weather', (req, res) => {
  res.json({ temp: 72, conditions: 'sunny' });
});

app.listen(3000);
```

**Hono:**

```typescript
import { Hono } from 'hono';
import { agentgate } from '@agentgate/middleware/hono';

const app = new Hono();

app.use('/api/*', agentgate({
  wallet: '0xYourWallet',
  routes: {
    'GET /api/weather': {
      price: '$0.001',
      description: 'Current weather data',
      category: 'data',
    },
  },
}));
```

**Next.js (App Router):**

```typescript
// app/api/weather/route.ts
import { withAgentGate } from '@agentgate/middleware/next';

async function GET(request: Request) {
  return Response.json({ temp: 72 });
}

export default withAgentGate(GET, {
  wallet: '0xYourWallet',
  price: '$0.001',
  description: 'Weather data',
  category: 'data',
});
```

### 3. Deploy

Deploy your API as usual. The middleware handles everything:

- **Payment validation** — agents pay per-request via x402
- **Marketplace registration** — your endpoint is discoverable
- **Analytics** — track revenue and usage in your dashboard

### 4. Check Your Dashboard

Visit [agentgate.ai/dashboard](https://agentgate.ai/dashboard) to see:

- Revenue (USDC) in real-time
- Transaction history
- Per-endpoint breakdowns
- Agent wallet activity

## Configuration File

After `npx agent-gate init`, your project will have a `.agentgate.json`:

```json
{
  "apiKey": "ag_xxxxxxxxxxxxxxxxxxxx",
  "wallet": "0xYourWallet",
  "network": "eip155:8453",
  "facilitator": "https://api.cdp.coinbase.com/platform/v2/x402",
  "routes": {
    "GET /api/weather": {
      "price": "0.001",
      "description": "Current weather data",
      "category": "data"
    }
  }
}
```

## What's Happening Under the Hood

1. Your middleware intercepts requests to protected routes
2. If no x402 payment header is present, it returns `402 Payment Required` with pricing info
3. The agent constructs a payment via the x402 facilitator (Coinbase CDP)
4. Payment settles in USDC on Base (L2)
5. Your middleware validates the payment and serves the response
6. An analytics event is sent (asynchronously) to the AgentGate marketplace

## Next Steps

- [Middleware Reference](./middleware-reference.md) — All config options
- [Pricing Guide](./pricing-guide.md) — How to price your endpoints
- [Discovery API](./discovery-api.md) — How agents find your API
