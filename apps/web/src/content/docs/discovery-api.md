# Discovery API Reference

The Discovery API lets AI agents search, browse, and find monetized API endpoints on the AgentGate marketplace.

**Base URL:** `https://api.agentgate.online`

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
curl "https://api.agentgate.online/v1/discover?category=data&q=weather&sort=quality&limit=10"
```

**Response:**

```json
{
  "endpoints": [
    {
      "id": "uuid",
      "url": "https://fulfill.agentgate.online/v1/email-validate",
      "method": "POST",
      "description": "Email → MX check, disposable detection, typo suggestions",
      "category": "data",
      "price_usdc": "0.0005",
      "networks": ["eip155:8453", "solana:mainnet"],
      "seller": {
        "display_name": "AgentGate",
        "verified": true
      },
      "health": {
        "uptime_7d": 0.998,
        "avg_latency_ms": 142,
        "total_transactions": 14892
      },
      "input_schema": { "email": "string" },
      "output_schema": { "example": { "valid": true, "mx": true } }
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
curl "https://api.agentgate.online/v1/discover/550e8400-e29b-41d4-a716-446655440000"
```

**Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "url": "https://fulfill.agentgate.online/v1/email-validate",
  "method": "POST",
  "description": "Email → MX check, disposable detection, typo suggestions",
  "category": "data",
  "price_usdc": "0.0005",
  "networks": ["eip155:8453", "solana:mainnet"],
  "seller": {
    "display_name": "AgentGate",
    "verified": true
  },
  "health": {
    "uptime_7d": 0.998,
    "avg_latency_ms": 142,
    "total_transactions": 14892
  },
  "input_schema": { "email": "string" },
  "output_schema": { "example": { "valid": true, "mx": true } }
}
```

---

### `GET /v1/discover/categories`

List all categories with endpoint counts.

**Request:**

```bash
curl "https://api.agentgate.online/v1/discover/categories"
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

Solana wallets are also accepted:

```json
{
  "wallet_address": "2mUNgWRnsca3vJJL4Q7ZAUTzwGXB4LftvUScdnGAZSdt"
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
  "network": "eip155:8453",
  "latency_ms": 142
}
```

---

## Using the Discovery API (Agent Example)

```typescript
// 1. Search for email validation APIs
const discovery = await fetch(
  "https://api.agentgate.online/v1/discover?category=data&q=email"
);
const { endpoints } = await discovery.json();

// 2. Pick the best one
const best = endpoints[0];
console.log(`Using ${best.url} at ${best.price_usdc} USDC/request`);

// 3. Make a paid request via x402
// First call returns 402 with payment-required header
const initial = await fetch(best.url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@gmail.com' }),
});

// Read the payment-required header, sign payment, retry with PAYMENT-SIGNATURE
const paymentInfo = initial.headers.get('payment-required');
const signature = await signPayment(paymentInfo); // your signing logic

const response = await fetch(best.url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'PAYMENT-SIGNATURE': signature,
  },
  body: JSON.stringify({ email: 'test@gmail.com' }),
});

const data = await response.json();
```
