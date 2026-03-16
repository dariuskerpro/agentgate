---
sidebar:
  order: 3
title: Next.js Middleware
description: Add x402 payments to Next.js App Router APIs
---

The Next.js integration wraps individual route handlers with x402 payment protection. Designed for the App Router pattern.

## Install

```bash
npm install @agent-gate/middleware
```

## Basic usage

```ts
// app/api/analyze/route.ts
import { withAgentGate } from "@agent-gate/middleware/next";

async function handler(request: Request) {
  const { text } = await request.json();
  return Response.json({
    sentiment: "positive",
    confidence: 0.92,
  });
}

export const POST = withAgentGate(handler, {
  wallet: "0xYOUR_EVM_WALLET_ADDRESS",
  price: "$0.05",
  description: "AI text analysis",
  category: "ai",
});
```

## Configuration

### `WithAgentGateOptions`

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `wallet` | `string` | Yes | Your EVM wallet address |
| `price` | `string` | Yes | Price in USDC (e.g. `"$0.05"`) |
| `description` | `string` | No | Endpoint description |
| `category` | `string` | No | Category for marketplace |
| `marketplace` | `{ apiKey, baseUrl? }` | No | Marketplace credentials |
| `facilitator` | `string` | No | Facilitator URL |
| `network` | `string` | No | Chain ID (default: `eip155:8453`) |

## Key difference from Express/Hono

The Next.js wrapper is **per-route** instead of config-based. You wrap each handler individually:

```ts
// Express/Hono: one config object with all routes
agentgate({
  wallet: "0x...",
  routes: {
    "POST /api/a": { price: "$0.01" },
    "POST /api/b": { price: "$0.05" },
  },
});

// Next.js: wrap each route handler
export const POST = withAgentGate(handler, {
  wallet: "0x...",
  price: "$0.01",
});
```

This fits the App Router's file-based routing — each route file controls its own payment config.

## Multiple endpoints example

```ts
// app/api/weather/route.ts
import { withAgentGate } from "@agent-gate/middleware/next";

async function getWeather(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city") || "San Francisco";
  return Response.json({ city, temp: 72, unit: "F" });
}

export const GET = withAgentGate(getWeather, {
  wallet: process.env.SELLER_WALLET!,
  price: "$0.001",
  description: "Current weather by city",
  category: "data",
});
```

```ts
// app/api/summarize/route.ts
import { withAgentGate } from "@agent-gate/middleware/next";

async function summarize(request: Request) {
  const { text } = await request.json();
  return Response.json({ summary: "..." });
}

export const POST = withAgentGate(summarize, {
  wallet: process.env.SELLER_WALLET!,
  price: "$0.03",
  description: "Summarize long text",
  category: "ai",
  marketplace: {
    apiKey: process.env.AGENTGATE_API_KEY!,
    baseUrl: "https://api.agentgate.online",
  },
});
```

## 402 response format

Same as Express and Hono:

```json
{
  "error": "Payment Required",
  "price": 0.05,
  "currency": "USDC",
  "network": "eip155:8453",
  "wallet": "0xYOUR_WALLET",
  "facilitator": "https://api.cdp.coinbase.com/platform/v2/x402"
}
```

## Error handling

`withAgentGate` throws at initialization if `wallet` is missing or `price` is invalid. This crashes the Next.js dev server immediately, making misconfiguration obvious.
