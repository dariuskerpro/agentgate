---
sidebar:
  order: 3
title: Quickstart for Buyers
description: Call pay-per-call APIs from code, CLI, or AI agents
---

Calling AgentGate endpoints requires no signup and no API keys. You pay per call with USDC.

## Using the SDK

```bash
npm install @agent-gate/sdk
```

### Discover endpoints

```ts
import { AgentGateClient } from "@agent-gate/sdk";

const client = new AgentGateClient();

// Browse all endpoints
const { endpoints } = await client.discover();
console.log(endpoints);

// Filter by category
const { endpoints: codeEndpoints } = await client.discover({
  category: "code",
});

// List categories
const { categories } = await client.categories();
console.log(categories);
// [{ category: "audio", count: 3 }, { category: "code", count: 3 }, ...]
```

### Call an endpoint

```ts
const result = await client.call("POST /v1/email-validate", {
  body: { email: "test@example.com" },
  paymentHeader: "your-signed-x402-payment",
});

if (result.status === 200) {
  console.log(result.data);
} else if (result.paymentRequired) {
  console.log("Price:", result.paymentRequired.price);
  console.log("Pay to:", result.paymentRequired.payTo);
}
```

The SDK hits the fulfillment API at `fulfill.agentgate.online` by default. Override with:

```ts
const client = new AgentGateClient({
  apiUrl: "https://api.agentgate.online",
  fulfillUrl: "https://fulfill.agentgate.online",
});
```

## Using the MCP Server

The `@agent-gate/mcp` package lets AI coding agents (Claude Code, Cursor, Windsurf) discover and call AgentGate endpoints as tools.

### Install globally

```bash
npm install -g @agent-gate/mcp
```

### Add to Claude Code

In your `.claude/settings.json`:

```json
{
  "mcpServers": {
    "agentgate": {
      "command": "agentgate-mcp",
      "env": {
        "AGENTGATE_WALLET_PRIVATE_KEY": "your-private-key"
      }
    }
  }
}
```

### Add to Cursor

In `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "agentgate": {
      "command": "agentgate-mcp",
      "env": {
        "AGENTGATE_WALLET_PRIVATE_KEY": "your-private-key"
      }
    }
  }
}
```

The MCP server exposes tools like `agentgate_discover`, `agentgate_call`, and `agentgate_categories` that your AI agent can use directly.

## Direct HTTP with x402

You don't need the SDK. Any HTTP client works — you just need to handle the 402 flow.

### Step 1: Make the request

```bash
curl -X POST https://fulfill.agentgate.online/v1/crypto-price \
  -H "Content-Type: application/json" \
  -d '{"symbol": "ETH"}'
```

### Step 2: Get the 402 response

```json
{
  "error": "Payment Required",
  "accepts": [
    {
      "scheme": "exact",
      "network": "eip155:8453",
      "price": "$0.0001",
      "payTo": "0x..."
    },
    {
      "scheme": "exact",
      "network": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
      "price": "$0.0001",
      "payTo": "So1..."
    }
  ]
}
```

### Step 3: Sign and retry

Sign a USDC payment matching the requirements, then retry with the payment header:

```bash
curl -X POST https://fulfill.agentgate.online/v1/crypto-price \
  -H "Content-Type: application/json" \
  -H "X-402-Payment: <base64-encoded-signed-payment>" \
  -d '{"symbol": "ETH"}'
```

### Step 4: Get the result

```json
{
  "symbol": "ETH",
  "price_usd": 3456.78,
  "change_24h": 2.3,
  "market_cap": 415000000000,
  "volume_24h": 12000000000
}
```

## Networks supported

| Network | Chain ID | USDC Contract |
|---------|----------|---------------|
| Base Mainnet | `eip155:8453` | Standard USDC |
| Solana Mainnet | `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp` | Standard USDC |

Both networks are supported on all endpoints. Pay with whichever chain you prefer.

## Next steps

- [Live Endpoints](/api/endpoints) — See all available endpoints with prices
- [Discovery API](/api/discovery) — Programmatic endpoint discovery
- [x402 Protocol](/architecture/x402) — How the payment flow works
