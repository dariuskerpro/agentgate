---
sidebar:
  order: 2
title: Hono Middleware
description: Add x402 payments to Hono APIs
---

The Hono middleware works on any runtime — Cloudflare Workers, Deno Deploy, Bun, and Node.js. No Node.js-specific APIs used.

## Install

```bash
npm install @agent-gate/middleware
```

## Basic usage

```ts
import { Hono } from "hono";
import { agentgate } from "@agent-gate/middleware/hono";

const app = new Hono();

// Apply to all /api/* routes
app.use(
  "/api/*",
  agentgate({
    wallet: "0xYOUR_EVM_WALLET_ADDRESS",
    routes: {
      "GET /api/weather": {
        price: "$0.001",
        description: "Current weather data",
      },
      "POST /api/analyze": {
        price: "$0.05",
        description: "AI text analysis",
      },
    },
  })
);

// Free routes (outside /api/*)
app.get("/health", (c) => c.json({ status: "ok" }));

// Paid routes
app.get("/api/weather", (c) => {
  return c.json({ temp: 72, unit: "F" });
});

app.post("/api/analyze", async (c) => {
  const { text } = await c.req.json();
  return c.json({ sentiment: "positive" });
});

export default app;
```

## Cloudflare Workers example

```ts
// src/index.ts
import { Hono } from "hono";
import { agentgate } from "@agent-gate/middleware/hono";

const app = new Hono();

app.use(
  "/api/*",
  agentgate({
    wallet: "0xYOUR_WALLET",
    routes: {
      "POST /api/translate": {
        price: "$0.01",
        description: "Translate text between languages",
        category: "ai",
      },
    },
  })
);

app.post("/api/translate", async (c) => {
  const { text, target_lang } = await c.req.json();
  // Your translation logic
  return c.json({ translated: "...", source_lang: "en", target_lang });
});

export default app;
```

```toml
# wrangler.toml
name = "my-paid-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"
```

## Configuration

Same `AgentGateConfig` as Express — see [Express middleware](/middleware/express) for full config reference.

The Hono middleware uses the shared utility functions (`validateAndParseConfig`, `matchRoute`, `fireAnalytics`, `build402Body`) from the middleware package internals.

## Route scoping

You can scope the middleware to specific path prefixes:

```ts
// Only /api/* routes are checked for payments
app.use("/api/*", agentgate({ ... }));

// Or apply globally and let unconfigured routes pass through
app.use("*", agentgate({ ... }));
```

Routes not listed in the `routes` config always pass through, regardless of the middleware mount path.

## 402 response format

Same as Express — returns a JSON body with `error`, `price`, `currency`, `network`, `wallet`, and `facilitator`.

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
