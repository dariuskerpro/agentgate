---
sidebar:
  order: 2
title: Discovery API
description: Find and browse available endpoints programmatically
---

The Discovery API is hosted at `api.agentgate.online` and requires no authentication. Use it to browse available endpoints, filter by category, and search by keyword.

## GET /v1/discover

Search and browse active endpoints.

### Query parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `category` | string | — | Filter by category (e.g. `code`, `audio`, `data`) |
| `q` | string | — | Full-text search across endpoint descriptions |
| `sort` | string | `quality` | Sort by: `quality`, `price`, or `newest` |
| `limit` | number | `20` | Max results to return |
| `offset` | number | `0` | Pagination offset |

### Example: List all endpoints

```bash
curl "https://api.agentgate.online/v1/discover"
```

**Response:**

```json
{
  "endpoints": [
    {
      "id": "ep_abc123",
      "url": "https://fulfill.agentgate.online/v1/code-review",
      "method": "POST",
      "description": "Code review — security, performance, and architecture feedback (up to 100K chars)",
      "category": "code",
      "price_usdc": "0.050",
      "active": true
    },
    {
      "id": "ep_def456",
      "url": "https://fulfill.agentgate.online/v1/email-validate",
      "method": "POST",
      "description": "Email validation — format check, MX lookup, deliverability assessment",
      "category": "utility",
      "price_usdc": "0.0003",
      "active": true
    }
  ],
  "total": 11,
  "limit": 20,
  "offset": 0
}
```

### Example: Filter by category

```bash
curl "https://api.agentgate.online/v1/discover?category=code"
```

### Example: Search by keyword

```bash
curl "https://api.agentgate.online/v1/discover?q=pdf"
```

### Example: Sort by price, paginated

```bash
curl "https://api.agentgate.online/v1/discover?sort=price&limit=5&offset=0"
```

---

## GET /v1/discover/categories

List all categories with endpoint counts.

```bash
curl "https://api.agentgate.online/v1/discover/categories"
```

**Response:**

```json
{
  "categories": [
    { "category": "audio", "count": 1 },
    { "category": "code", "count": 1 },
    { "category": "data", "count": 2 },
    { "category": "documents", "count": 2 },
    { "category": "utility", "count": 5 }
  ]
}
```

---

## GET /v1/discover/:id

Get details for a specific endpoint by ID.

```bash
curl "https://api.agentgate.online/v1/discover/ep_abc123"
```

**Response:**

```json
{
  "id": "ep_abc123",
  "url": "https://fulfill.agentgate.online/v1/code-review",
  "method": "POST",
  "description": "Code review — security, performance, and architecture feedback (up to 100K chars)",
  "category": "code",
  "price_usdc": "0.050",
  "active": true,
  "seller": {
    "display_name": "AgentGate",
    "verified": true
  }
}
```

Returns `404` if the endpoint doesn't exist or is inactive.

---

## Using with the SDK

```ts
import { AgentGateClient } from "@agent-gate/sdk";

const client = new AgentGateClient();

// Browse all
const all = await client.discover();

// Filter by category
const code = await client.discover({ category: "code" });

// With limit
const top5 = await client.discover({ limit: 5 });

// List categories
const cats = await client.categories();
```

See [Quickstart for Buyers](/getting-started/buyers) for full SDK usage.
