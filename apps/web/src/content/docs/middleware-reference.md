# Middleware Reference

AgentGate provides middleware for Express, Hono, and Next.js. All middleware packages are exported from `@agent-gate/middleware`.

## Installation

```bash
npm install @agent-gate/middleware
# or
pnpm add @agent-gate/middleware
```

## Common Configuration

All middleware variants accept the same core config:

```typescript
interface AgentGateConfig {
  /** Ethereum wallet address to receive USDC payments */
  wallet: string;

  /** Route-level pricing and metadata */
  routes: Record<string, RouteConfig>;

  /** Optional: marketplace API key for analytics */
  marketplace?: {
    apiKey: string;
    url?: string; // defaults to https://api.agentgate.ai
  };

  /** Optional: x402 facilitator URL */
  facilitator?: string; // defaults to Coinbase CDP

  /** Optional: network identifier */
  network?: string; // defaults to eip155:8453 (Base mainnet)
}

interface RouteConfig {
  /** Price per request in USDC (e.g., "$0.001" or "0.001") */
  price: string;

  /** Human-readable description of the endpoint */
  description: string;

  /** Category for marketplace discovery */
  category: 'data' | 'compute' | 'ml' | 'storage' | 'other';

  /** Optional: input schema for documentation */
  input?: Record<string, string>;

  /** Optional: output example for documentation */
  output?: Record<string, unknown>;
}
```

## Express

```typescript
import { agentgate } from '@agent-gate/middleware/express';
// or
import { agentgate } from '@agent-gate/middleware';

const app = express();

app.use(agentgate({
  wallet: '0x...',
  routes: {
    'GET /api/weather': {
      price: '$0.001',
      description: 'Weather data for any city',
      category: 'data',
      input: { query: 'city name (string)' },
      output: { example: { temp: 72, conditions: 'sunny' } },
    },
    'POST /api/scrape': {
      price: '$0.005',
      description: 'Scrape and parse any URL',
      category: 'data',
    },
  },
}));
```

**Behavior:**
- Routes matching the config require x402 payment
- Unmatched routes pass through without payment requirement
- Analytics events fire asynchronously (never block the response)

## Hono

```typescript
import { agentgate } from '@agent-gate/middleware/hono';

const app = new Hono();

app.use('/api/*', agentgate({
  wallet: '0x...',
  routes: {
    'GET /api/weather': {
      price: '$0.001',
      description: 'Weather data',
      category: 'data',
    },
  },
}));
```

**Notes:**
- Cloudflare Workers compatible (no Node.js-specific APIs)
- Works identically to Express middleware
- Hono is an optional peer dependency

## Next.js (App Router)

```typescript
import { withAgentGate } from '@agent-gate/middleware/next';

// Per-route handler wrapping
async function GET(request: Request) {
  return Response.json({ temp: 72 });
}

export default withAgentGate(GET, {
  wallet: '0x...',
  price: '$0.001',
  description: 'Weather data',
  category: 'data',
});
```

**Notes:**
- Route-level configuration (not in `middleware.ts`)
- Each handler specifies its own pricing
- Works with async handlers
- App Router only (Pages Router not supported)

## Price Format

Prices can be specified as:
- `"$0.001"` — with dollar sign prefix
- `"0.001"` — numeric string

Both are interpreted as USDC amounts. Invalid or negative prices are rejected at initialization.

## Error Handling

- If no payment header: returns `402 Payment Required` with pricing info
- If invalid payment: returns `402` with error details
- If marketplace API is unreachable: middleware continues to process payments (graceful degradation)
- Analytics failures never block the payment flow

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `AGENTGATE_MARKETPLACE_URL` | Marketplace API base URL | `https://api.agentgate.ai` |
| `AGENTGATE_FACILITATOR_URL` | x402 facilitator URL | Coinbase CDP URL |
| `AGENTGATE_NETWORK` | Network identifier | `eip155:8453` |
