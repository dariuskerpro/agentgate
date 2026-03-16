---
sidebar:
  order: 2
title: Quickstart for Sellers
description: Add x402 payments to your API in 5 minutes
---

You have an API. You want to charge per call. Here's how.

## Install

```bash
npm install @agent-gate/middleware
```

## Express

```ts
import express from "express";
import { agentgate } from "@agent-gate/middleware/express";

const app = express();
app.use(express.json());

// Add x402 payment protection
app.use(
  agentgate({
    wallet: "0xYOUR_WALLET_ADDRESS",
    routes: {
      "POST /api/analyze": {
        price: "$0.05",
        description: "Analyze text with AI",
        category: "ai",
      },
      "GET /api/data": {
        price: "$0.001",
        description: "Fetch structured data",
        category: "data",
      },
    },
  })
);

// Your existing route handlers — no changes needed
app.post("/api/analyze", (req, res) => {
  res.json({ result: "analysis complete" });
});

app.get("/api/data", (req, res) => {
  res.json({ data: [1, 2, 3] });
});

app.listen(3000);
```

That's it. Requests without a valid `X-402-Payment` header get a `402 Payment Required` response. Requests with a valid payment go through to your handler.

## Hono

```ts
import { Hono } from "hono";
import { agentgate } from "@agent-gate/middleware/hono";

const app = new Hono();

app.use(
  "/api/*",
  agentgate({
    wallet: "0xYOUR_WALLET_ADDRESS",
    routes: {
      "POST /api/analyze": {
        price: "$0.05",
        description: "Analyze text with AI",
      },
    },
  })
);

app.post("/api/analyze", (c) => {
  return c.json({ result: "analysis complete" });
});

export default app;
```

Works on Cloudflare Workers, Deno Deploy, Bun, and Node.js.

## Next.js (App Router)

```ts
// app/api/analyze/route.ts
import { withAgentGate } from "@agent-gate/middleware/next";

async function POST(request: Request) {
  const body = await request.json();
  return Response.json({ result: "analysis complete" });
}

export const POST = withAgentGate(handler, {
  wallet: "0xYOUR_WALLET_ADDRESS",
  price: "$0.05",
  description: "Analyze text with AI",
  category: "ai",
});
```

## What happens when a request comes in

1. Middleware checks if the route has a price configured
2. If no `X-402-Payment` header → returns `402`:

```json
{
  "error": "Payment Required",
  "price": 0.05,
  "currency": "USDC",
  "network": "eip155:8453",
  "wallet": "0xYOUR_WALLET_ADDRESS",
  "facilitator": "https://x402.org/facilitator"
}
```

3. If payment header present → the facilitator verifies the payment on-chain, and the request passes through to your handler

## Pricing tips

| Tier | Price Range | Examples |
|------|------------|----------|
| Utility | $0.0001 – $0.001 | DNS lookup, email validation, crypto price |
| Data | $0.001 – $0.02 | Web scraping, metadata extraction, PDF parsing |
| AI Inference | $0.02 – $0.10 | Code review, transcription, document analysis |
| Pipeline | $0.10 – $1.00 | Multi-step workflows, full project scaffolding |

See [Pricing Guide](/architecture/pricing) for more detail.

## Register with the marketplace (optional)

To make your endpoints discoverable via the [Discovery API](/api/discovery):

```ts
app.use(
  agentgate({
    wallet: "0xYOUR_WALLET_ADDRESS",
    marketplace: {
      apiKey: "ag_your_key",
      baseUrl: "https://api.text2ai.com",
    },
    routes: {
      // ...
    },
  })
);
```

The middleware will automatically report transactions to the marketplace for analytics and discoverability. This is optional — x402 payments work without it.

## Next steps

- [Express middleware reference](/middleware/express)
- [Hono middleware reference](/middleware/hono)
- [Next.js middleware reference](/middleware/nextjs)
- [x402 Protocol](/architecture/x402) — How payments work under the hood
