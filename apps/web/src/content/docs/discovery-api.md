# Discovery API Reference

The Discovery API lets AI agents search, browse, and find monetized API endpoints on the AgentGate marketplace.

**Base URL:** `https://api.agentgate.ai`

All discovery endpoints are **public** — no authentication required. Rate limited to 100 requests/minute per IP.

---

## Endpoints

### `GET /v1/discover`

Search and browse all active endpoints.

**Query Parameters:**

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `category` | string | Filter by category (`data`, `compute`, `ml`, `storage`) | — |
| `q` | string | Full-text search on description | — |
| `sort` | string | Sort by `price`, `quality`, `newest` | `quality` |
| `limit` | number | Results per page (1–100) | 20 |
| `offset` | number | Pagination offset | 0 |

**Request:**

```bash
curl "https://api.agentgate.ai/v1/discover?category=data&q=weather&sort=quality&limit=10"
```

**Response:**

```json
{
  "endpoints": [
    {
      "id": "uuid",
      "url": "https://api.example.com/weather",
      "method": "GET",
      "description": "Real-time weather data for any city worldwide",
      "category": "data",
      "price_usdc": "0.001",
      "network": "eip155:8453",
      "seller": {
        "display_name": "WeatherCo",
        "verified": true
      },
      "health": {
        "uptime_7d": 0.998,
        "avg_latency_ms": 142,
        "total_transactions": 14892
      },
      "input_schema": { "query": "city name (string)" },
      "output_schema": { "example": { "temp": 72, "conditions": "sunny" } }
    }
  ],
  "total": 47,
  "page": 1
}
```

---

### `GET /v1/discover/:id`

Get full details for a specific endpoint, including health metrics.

**Request:**

```bash
curl "https://api.agentgate.ai/v1/discover/550e8400-e29b-41d4-a716-446655440000"
```

**Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "url": "https://api.example.com/weather",
  "method": "GET",
  "description": "Real-time weather data for any city worldwide",
  "category": "data",
  "price_usdc": "0.001",
  "network": "eip155:8453",
  "seller": {
    "display_name": "WeatherCo",
    "verified": true
  },
  "health": {
    "uptime_7d": 0.998,
    "avg_latency_ms": 142,
    "total_transactions": 14892
  },
  "input_schema": { "query": "city name (string)" },
  "output_schema": { "example": { "temp": 72, "conditions": "sunny" } }
}
```

---

### `GET /v1/discover/categories`

List all categories with endpoint counts.

**Request:**

```bash
curl "https://api.agentgate.ai/v1/discover/categories"
```

**Response:**

```json
{
  "categories": [
    { "name": "data", "count": 23 },
    { "name": "compute", "count": 12 },
    { "name": "ml", "count": 8 },
    { "name": "storage", "count": 4 }
  ]
}
```

---

## Seller Endpoints (Authenticated)

These endpoints require an API key in the `Authorization: Bearer ag_xxxxx` header.

### `POST /v1/sellers/register`

Register a new seller.

**Request Body:**

```json
{
  "wallet_address": "0x1234567890abcdef1234567890abcdef12345678"
}
```

**Response (201 Created):**

```json
{
  "id": "uuid",
  "wallet_address": "0x...",
  "api_key": "ag_xxxxxxxxxxxxxxxxxxxx",
  "display_name": null,
  "verified": false
}
```

---

### `GET /v1/sellers/me`

Get current seller profile.

**Response:**

```json
{
  "id": "uuid",
  "wallet_address": "0x...",
  "display_name": "WeatherCo",
  "verified": true
}
```

---

### `POST /v1/endpoints`

Register a new endpoint.

**Request Body:**

```json
{
  "url": "https://api.example.com/weather",
  "method": "GET",
  "description": "Real-time weather data for any city",
  "category": "data",
  "price_usdc": "0.001",
  "input_schema": { "query": "city name (string)" },
  "output_schema": { "example": { "temp": 72 } }
}
```

**Response (201 Created):** Full endpoint object.

---

### `PUT /v1/endpoints/:id`

Update an endpoint (owner only).

---

### `DELETE /v1/endpoints/:id`

Soft-delete (deactivate) an endpoint (owner only). Sets `active = false`.

---

### `GET /v1/endpoints/mine`

List the seller's own endpoints.

---

### `POST /v1/events/transaction`

Record a transaction event (called by middleware on settled payments).

**Request Body:**

```json
{
  "endpoint_id": "uuid",
  "buyer_wallet": "0x...",
  "amount_usdc": "0.001",
  "tx_hash": "0x...",
  "latency_ms": 142
}
```

---

## Using the Discovery API (Agent Example)

```typescript
// 1. Search for weather APIs
const discovery = await fetch(
  "https://api.agentgate.ai/v1/discover?category=data&q=weather"
);
const { endpoints } = await discovery.json();

// 2. Pick the best one
const best = endpoints[0];
console.log(`Using ${best.url} at ${best.price_usdc} USDC/request`);

// 3. Make a paid request via x402
const response = await fetch(best.url, {
  headers: {
    "X-402-Payment": constructPaymentHeader(best.price_usdc, best.network),
  },
});

const data = await response.json();
```
