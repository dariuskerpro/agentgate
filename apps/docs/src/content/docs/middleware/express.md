---
sidebar:
  order: 1
title: Express Middleware
description: Add x402 payments to Express.js APIs
---

The Express middleware wraps your routes with x402 payment protection. Unpaid requests get `402 Payment Required`. Paid requests pass through to your handler.

## Install

```bash
npm install @agent-gate/middleware
```

## Basic usage

```ts
import express from "express";
import { agentgate } from "@agent-gate/middleware/express";

const app = express();
app.use(express.json());

app.use(
  agentgate({
    wallet: "0xYOUR_EVM_WALLET_ADDRESS",
    routes: {
      "GET /api/weather": {
        price: "$0.001",
        description: "Current weather data",
        category: "data",
      },
      "POST /api/analyze": {
        price: "$0.05",
        description: "AI text analysis",
        category: "ai",
      },
    },
  })
);

// Routes without a price config pass through freely
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Paid routes — only reached after payment verification
app.get("/api/weather", (req, res) => {
  res.json({ temp: 72, unit: "F", city: "San Francisco" });
});

app.post("/api/analyze", (req, res) => {
  const { text } = req.body;
  res.json({ sentiment: "positive", confidence: 0.92 });
});

app.listen(3000);
```

## Configuration

### `AgentGateConfig`

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `wallet` | `string` | Yes | Your EVM wallet address to receive USDC payments |
| `routes` | `Record<string, RouteConfig>` | Yes | Route-level pricing configuration |
| `marketplace` | `{ apiKey, baseUrl? }` | No | Marketplace API credentials for analytics |
| `facilitator` | `string` | No | Facilitator URL (default: `https://api.cdp.coinbase.com/platform/v2/x402`) |
| `network` | `string` | No | Chain ID (default: `eip155:8453` for Base mainnet) |

### `RouteConfig`

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `price` | `string` | Yes | Price in USDC (e.g. `"$0.05"` or `"0.05"`) |
| `description` | `string` | No | Human-readable endpoint description |
| `category` | `string` | No | Category for marketplace discovery |
| `input` | `object` | No | JSON schema for request body |
| `output` | `object` | No | JSON schema for response body |

### Route key format

Routes are specified as `"METHOD /path"`:

```ts
routes: {
  "GET /api/data": { price: "$0.001" },
  "POST /api/analyze": { price: "$0.05" },
  "PUT /api/update": { price: "$0.01" },
}
```

The method and path must match exactly. No wildcards or pattern matching.

## Full example with marketplace integration

```ts
import express from "express";
import { agentgate } from "@agent-gate/middleware/express";

const app = express();
app.use(express.json());

app.use(
  agentgate({
    wallet: process.env.SELLER_WALLET!,
    network: "eip155:8453",
    marketplace: {
      apiKey: process.env.AGENTGATE_API_KEY!,
      baseUrl: "https://api.text2ai.com",
    },
    routes: {
      "POST /api/summarize": {
        price: "$0.03",
        description: "Summarize long text into key points",
        category: "ai",
        input: { text: "string" },
        output: { summary: "string", key_points: "string[]" },
      },
    },
  })
);

app.post("/api/summarize", async (req, res) => {
  const { text } = req.body;
  // Your summarization logic
  res.json({
    summary: "...",
    key_points: ["Point 1", "Point 2"],
  });
});

app.listen(3000, () => {
  console.log("API running on port 3000 with x402 payments");
});
```

## 402 response format

When a request lacks the `X-402-Payment` header, the middleware returns:

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

The middleware throws at initialization if:
- `wallet` is missing or empty
- `routes` is missing or empty
- Any `price` value is invalid (negative, NaN, or non-numeric)

These are intentional fast failures — better to crash at startup than serve free requests.
