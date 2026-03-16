---
sidebar:
  order: 1
title: Live Endpoints
description: All available pay-per-call endpoints with prices and examples
---

All endpoints are hosted at `fulfill.text2ai.com` and protected by x402 payments. Every endpoint accepts both Base (EVM) and Solana USDC.

## Endpoint overview

| Endpoint | Price | Category | Description |
|----------|-------|----------|-------------|
| `POST /v1/code-review` | $0.05 | code | Security, performance, and architecture feedback |
| `POST /v1/transcript-to-prd` | $0.035 | documents | Meeting transcript → structured PRD |
| `POST /v1/email-validate` | $0.0003 | utility | Email format validation and deliverability check |
| `POST /v1/dns-lookup` | $0.0003 | utility | DNS records for any domain |
| `POST /v1/url-metadata` | $0.0005 | data | Title, OG tags, Twitter cards, favicon |
| `POST /v1/phone-validate` | $0.0003 | utility | Format check, E.164, country detection |
| `POST /v1/crypto-price` | $0.0001 | utility | Current price, 24h change, market cap |
| `POST /v1/ip-geolocate` | $0.0002 | utility | Country, city, ISP, coordinates |
| `POST /v1/scrape-enrich` | $0.012 | data | Fetch, extract, and structure web content |
| `POST /v1/transcribe` | $0.015 | audio | Speech-to-text with timestamps and segments |
| `POST /v1/pdf-extract` | $0.02 | documents | Text, tables, and key-value pairs from PDFs |

---

## Utility endpoints

### POST /v1/email-validate

Validate an email address — format check, MX record lookup, deliverability assessment.

**Price:** $0.0003

```bash
curl -X POST https://fulfill.text2ai.com/v1/email-validate \
  -H "Content-Type: application/json" \
  -H "X-402-Payment: <payment>" \
  -d '{"email": "user@example.com"}'
```

**Response:**
```json
{
  "email": "user@example.com",
  "valid": true,
  "format_valid": true,
  "mx_found": true,
  "disposable": false,
  "suggestion": null
}
```

### POST /v1/dns-lookup

Look up DNS records — A, AAAA, MX, NS, TXT, CNAME, SOA.

**Price:** $0.0003

```bash
curl -X POST https://fulfill.text2ai.com/v1/dns-lookup \
  -H "Content-Type: application/json" \
  -H "X-402-Payment: <payment>" \
  -d '{"domain": "example.com", "types": ["A", "MX", "TXT"]}'
```

**Response:**
```json
{
  "domain": "example.com",
  "records": {
    "A": ["93.184.216.34"],
    "MX": [{"priority": 10, "exchange": "mail.example.com"}],
    "TXT": ["v=spf1 include:_spf.example.com ~all"]
  }
}
```

### POST /v1/phone-validate

Validate and normalize phone numbers.

**Price:** $0.0003

```bash
curl -X POST https://fulfill.text2ai.com/v1/phone-validate \
  -H "Content-Type: application/json" \
  -H "X-402-Payment: <payment>" \
  -d '{"phone": "+1 (555) 123-4567"}'
```

**Response:**
```json
{
  "phone": "+15551234567",
  "valid": true,
  "country_code": "US",
  "type": "mobile",
  "e164": "+15551234567"
}
```

### POST /v1/crypto-price

Get current cryptocurrency prices and market data.

**Price:** $0.0001

```bash
curl -X POST https://fulfill.text2ai.com/v1/crypto-price \
  -H "Content-Type: application/json" \
  -H "X-402-Payment: <payment>" \
  -d '{"symbol": "ETH"}'
```

**Response:**
```json
{
  "symbol": "ETH",
  "price_usd": 3456.78,
  "change_24h": 2.3,
  "market_cap": 415000000000,
  "volume_24h": 12000000000
}
```

### POST /v1/ip-geolocate

Geolocate an IP address — country, city, ISP, coordinates, timezone.

**Price:** $0.0002

```bash
curl -X POST https://fulfill.text2ai.com/v1/ip-geolocate \
  -H "Content-Type: application/json" \
  -H "X-402-Payment: <payment>" \
  -d '{"ip": "8.8.8.8"}'
```

**Response:**
```json
{
  "ip": "8.8.8.8",
  "country": "US",
  "city": "Mountain View",
  "region": "California",
  "isp": "Google LLC",
  "lat": 37.386,
  "lon": -122.0838,
  "timezone": "America/Los_Angeles"
}
```

---

## Data endpoints

### POST /v1/url-metadata

Extract metadata from any URL — title, description, Open Graph tags, Twitter cards, favicon.

**Price:** $0.0005

```bash
curl -X POST https://fulfill.text2ai.com/v1/url-metadata \
  -H "Content-Type: application/json" \
  -H "X-402-Payment: <payment>" \
  -d '{"url": "https://github.com"}'
```

**Response:**
```json
{
  "url": "https://github.com",
  "title": "GitHub: Let's build from here",
  "description": "GitHub is where over 100 million developers shape the future of software.",
  "og": {
    "title": "GitHub: Let's build from here",
    "image": "https://github.githubassets.com/images/modules/site/social-cards/campaign-social.png",
    "type": "website"
  },
  "twitter": {
    "card": "summary_large_image",
    "site": "@github"
  },
  "favicon": "https://github.githubassets.com/favicons/favicon.svg"
}
```

### POST /v1/scrape-enrich

Scrape a URL and extract structured content, optionally enriched with AI.

**Price:** $0.012

```bash
curl -X POST https://fulfill.text2ai.com/v1/scrape-enrich \
  -H "Content-Type: application/json" \
  -H "X-402-Payment: <payment>" \
  -d '{"url": "https://example.com/blog/post", "extract": true}'
```

**Response:**
```json
{
  "url": "https://example.com/blog/post",
  "title": "How We Scaled to 1M Users",
  "content": "...",
  "extracted": {
    "summary": "Article about scaling infrastructure...",
    "topics": ["scaling", "infrastructure", "kubernetes"],
    "entities": ["AWS", "Kubernetes", "PostgreSQL"]
  },
  "metadata": {
    "word_count": 2450,
    "language": "en",
    "published_date": "2024-01-15"
  }
}
```

---

## AI inference endpoints

### POST /v1/code-review

AI-powered code review — security issues, performance problems, architecture feedback. Accepts up to 100K characters.

**Price:** $0.05

```bash
curl -X POST https://fulfill.text2ai.com/v1/code-review \
  -H "Content-Type: application/json" \
  -H "X-402-Payment: <payment>" \
  -d '{
    "code": "function login(user, pass) {\n  const q = `SELECT * FROM users WHERE name=\"${user}\" AND pass=\"${pass}\"`;\n  return db.query(q);\n}",
    "language": "javascript"
  }'
```

**Response:**
```json
{
  "issues": [
    {
      "severity": "critical",
      "type": "security",
      "line": 2,
      "message": "SQL injection vulnerability — user input is interpolated directly into query string",
      "suggestion": "Use parameterized queries: db.query('SELECT * FROM users WHERE name = ? AND pass = ?', [user, pass])"
    }
  ],
  "summary": "1 critical security issue found. The login function is vulnerable to SQL injection.",
  "score": 15
}
```

### POST /v1/transcript-to-prd

Convert a meeting transcript into a structured PRD with user stories, acceptance criteria, and priorities.

**Price:** $0.035

```bash
curl -X POST https://fulfill.text2ai.com/v1/transcript-to-prd \
  -H "Content-Type: application/json" \
  -H "X-402-Payment: <payment>" \
  -d '{"transcript": "PM: We need to add search to the dashboard. It should support full-text search across all fields. Designer: Should we add filters too? PM: Yes, filters for date range and status..."}'
```

**Response:**
```json
{
  "title": "Dashboard Search & Filtering",
  "summary": "Add full-text search and filtering capabilities to the dashboard",
  "user_stories": [
    {
      "story": "As a user, I want to search across all dashboard fields so I can quickly find relevant items",
      "acceptance_criteria": [
        "Search input is visible on the dashboard",
        "Results update as user types (debounced)",
        "All text fields are searchable"
      ],
      "priority": "high"
    }
  ]
}
```

### POST /v1/transcribe

Transcribe audio to text with timestamps, segments, and language detection.

**Price:** $0.015

```bash
curl -X POST https://fulfill.text2ai.com/v1/transcribe \
  -H "Content-Type: application/json" \
  -H "X-402-Payment: <payment>" \
  -d '{"audio_url": "https://example.com/meeting.mp3"}'
```

**Response:**
```json
{
  "text": "Welcome to the meeting. Today we'll discuss the Q4 roadmap...",
  "language": "en",
  "duration_seconds": 1847,
  "segments": [
    {
      "start": 0.0,
      "end": 4.2,
      "text": "Welcome to the meeting.",
      "speaker": "Speaker 1"
    }
  ]
}
```

### POST /v1/pdf-extract

Extract text, tables, and key-value pairs from PDF documents using Gemini.

**Price:** $0.02

```bash
curl -X POST https://fulfill.text2ai.com/v1/pdf-extract \
  -H "Content-Type: application/json" \
  -H "X-402-Payment: <payment>" \
  -d '{"pdf_url": "https://example.com/invoice.pdf"}'
```

**Response:**
```json
{
  "text": "Invoice #12345\nDate: 2024-01-15\n...",
  "tables": [
    {
      "headers": ["Item", "Qty", "Price"],
      "rows": [
        ["Widget A", "10", "$5.00"],
        ["Widget B", "5", "$12.00"]
      ]
    }
  ],
  "key_values": {
    "invoice_number": "12345",
    "date": "2024-01-15",
    "total": "$110.00"
  }
}
```

---

## Health check

All fulfillment instances expose a free health endpoint:

```bash
curl https://fulfill.text2ai.com/health
```

```json
{
  "status": "ok",
  "payments": true,
  "networks": {
    "evm": "eip155:8453",
    "solana": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"
  },
  "facilitator": "https://x402.org/facilitator"
}
```
