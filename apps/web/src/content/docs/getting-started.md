# Getting Started with AgentGate

Monetize your API for AI agents in under 5 minutes.

## Prerequisites

- Node.js 18+ installed
- A wallet address to receive USDC payments (EVM on Base **or** Solana)
- An existing API project (Express, Hono, or Next.js)

## Quick Start

### 1. Initialize AgentGate

Run the setup wizard in your project directory:

```bash
npx @dkerpal/agent-gate init
```

The CLI will:
- Auto-detect your framework (Express, Hono, Next.js)
- Ask for your wallet address (EVM or Solana)
- Register you on the AgentGate marketplace
- Generate a `.agentgate.json` config file

### 2. Add the Middleware

**Express:**

```typescript
import express from 'express';
import { agentgate } from '@agent-gate/middleware/express';

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
import { agentgate } from '@agent-gate/middleware/hono';

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
import { withAgentGate } from '@agent-gate/middleware/next';

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

Visit [agentgate.online/dashboard](https://agentgate.online/dashboard) to see:

- Revenue (USDC) in real-time
- Transaction history
- Per-endpoint breakdowns
- Agent wallet activity

## Buyer Quick Start

Already have a USDC wallet and want to call an AgentGate endpoint? No account needed.

### 1. Find an Endpoint

Browse available endpoints on the marketplace or query the Discovery API:

```bash
curl "https://api.agentgate.online/v1/discover?q=transcribe"
```

### 2. Call It

Make a request to the fulfillment API. You'll get a `402 Payment Required` response with a base64-encoded `payment-required` header containing pricing and payment details:

```bash
curl -X POST https://fulfill.agentgate.online/v1/email-validate \
  -H "Content-Type: application/json" \
  -d '{"email": "test@gmail.com"}'
# → 402 Payment Required
# → payment-required header with price, network, and facilitator info
```

### 3. Sign and Pay

Your agent (or SDK) reads the `payment-required` header, signs a USDC payment on Base or Solana, and retries with the `PAYMENT-SIGNATURE` header:

```bash
curl -X POST https://fulfill.agentgate.online/v1/email-validate \
  -H "Content-Type: application/json" \
  -H "PAYMENT-SIGNATURE: <base64-encoded-signed-payment>" \
  -d '{"email": "test@gmail.com"}'
# → 200 OK + result
```

The SDK handles this flow automatically:

```typescript
import { AgentGateClient } from '@agent-gate/sdk';

const client = new AgentGateClient();
const result = await client.call('/v1/email-validate', { email: 'test@gmail.com' });
```

## Configuration File

After `npx @dkerpal/agent-gate init`, your project will have a `.agentgate.json`:

**EVM (Base) config:**

```json
{
  "apiKey": "ag_xxxxxxxxxxxxxxxxxxxx",
  "wallet": "0xYourWallet",
  "network": "eip155:8453",
  "facilitator": "https://facilitator.agentgate.online",
  "routes": {
    "GET /api/weather": {
      "price": "0.001",
      "description": "Current weather data",
      "category": "data"
    }
  }
}
```

**Solana config:**

```json
{
  "apiKey": "ag_xxxxxxxxxxxxxxxxxxxx",
  "wallet": "YourSolanaWalletAddress",
  "network": "solana:mainnet",
  "facilitator": "https://facilitator.agentgate.online",
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
2. If no payment header is present, it returns `402 Payment Required` with a base64-encoded `payment-required` header containing pricing info
3. The agent signs a USDC payment (on Base or Solana) via the x402 facilitator
4. The agent retries with a `PAYMENT-SIGNATURE` header (v2 protocol)
5. Your middleware validates the payment through the self-hosted facilitator and serves the response
6. USDC settles to your wallet on Base or Solana
7. An analytics event is sent (asynchronously) to the AgentGate marketplace

## Next Steps

- [Middleware Reference](./middleware-reference.md) — All config options
- [Pricing Guide](./pricing-guide.md) — How to price your endpoints
- [Discovery API](./discovery-api.md) — How agents find your API
