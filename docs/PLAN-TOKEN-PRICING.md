# Token-Based Pricing Engine — Implementation Plan

> **Status:** Planning
> **Priority:** High — required before marketplace opening
> **Depends on:** Nothing (can build against current codebase)
> **Created:** 2026-03-16

---

## Problem

All 11 endpoints use flat pricing. A 50-token code review costs the same as a 50,000-token one. Sellers eat margin on big requests, overprice small ones. This doesn't scale for a marketplace where third-party sellers bring their own models.

## Solution

Dynamic per-token pricing with three modes: provider-mapped (default), custom per-token, and flat (legacy).

---

## Pricing Modes

### 1. Provider-Mapped (default for inference endpoints)

Seller picks their model. System looks up provider rates, applies markup (default 3%).

```json
{
  "pricing_mode": "provider_mapped",
  "provider": "anthropic",
  "model": "claude-sonnet-4",
  "markup_percent": 3,
  "min_charge": 0.001
}
```

**How it works:**
- System maintains a `provider_rates` table with per-model pricing
- Price = (input_tokens/1K × input_rate × (1 + markup/100)) + (est_output_tokens/1K × output_rate × (1 + markup/100))
- If result < min_charge, charge min_charge
- When providers change prices, update the table → all mapped sellers auto-adjust

### 2. Custom Per-Token

Seller sets their own rates. For fine-tuned models, self-hosted, or any non-standard provider.

```json
{
  "pricing_mode": "custom_token",
  "input_rate_per_1k": 0.003,
  "output_rate_per_1k": 0.015,
  "min_charge": 0.001
}
```

### 3. Flat (current model, kept for utility endpoints)

Static price per call regardless of input/output size.

```json
{
  "pricing_mode": "flat",
  "price": 0.0005
}
```

Best for: email validation, DNS lookup, crypto price — endpoints where cost doesn't vary with input.

---

## Provider Rate Table (seed data)

| Provider | Model | Input/1K tokens | Output/1K tokens | Unit |
|----------|-------|-----------------|-------------------|------|
| Anthropic | claude-sonnet-4 | $0.003 | $0.015 | tokens |
| Anthropic | claude-opus-4 | $0.015 | $0.075 | tokens |
| Anthropic | claude-haiku-3.5 | $0.0008 | $0.004 | tokens |
| OpenAI | gpt-4.1 | $0.002 | $0.008 | tokens |
| OpenAI | gpt-4.1-mini | $0.0004 | $0.0016 | tokens |
| OpenAI | gpt-4.1-nano | $0.0001 | $0.0004 | tokens |
| OpenAI | o4-mini | $0.0011 | $0.0044 | tokens |
| OpenAI | whisper-1 | $0.006 | — | minutes |
| Google | gemini-2.5-flash | $0.00015 | $0.0035 | tokens |
| Google | gemini-2.5-pro | $0.00125 | $0.01 | tokens |

**Update cadence:** Manual for now. Future: automated scraper or webhook.

---

## x402 Dynamic Pricing Flow

```
1. Request arrives at middleware
2. Middleware peeks at request body (does NOT consume it)
3. Count input tokens:
   - Text: tiktoken or chars/4 approximation
   - Audio: estimate from file size (~1 min per 1MB mp3)
   - PDF: estimate from file size (~500 tokens per page)
4. Determine max output tokens:
   - From request body max_tokens if provided
   - Else model default (4096 for most, 8192 for Opus)
5. Look up endpoint pricing config
6. Calculate price based on mode:
   - provider_mapped: rates from provider_rates table × (1 + markup%)
   - custom_token: rates from pricing_config
   - flat: static price
7. Return 402 with calculated price
8. Agent pays, request executes
9. Track actual token usage for analytics
```

**Key constraint:** x402 price is set BEFORE inference runs. Output tokens are estimated from max_tokens. Seller keeps the difference if actual output is shorter. This is standard in the industry (OpenAI charges for requested max_tokens in some batch modes).

---

## Database Changes

### New table: `provider_rates`

```sql
CREATE TABLE provider_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  input_rate_per_1k NUMERIC(20,10) NOT NULL,
  output_rate_per_1k NUMERIC(20,10),
  unit TEXT NOT NULL DEFAULT 'tokens',  -- 'tokens' | 'minutes' | 'pages'
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider, model)
);
```

### Alter `endpoints` table

```sql
ALTER TABLE endpoints ADD COLUMN pricing_mode TEXT NOT NULL DEFAULT 'flat';
ALTER TABLE endpoints ADD COLUMN pricing_config JSONB;
-- pricing_config schema depends on pricing_mode (validated in app layer)
```

### New table: `usage_tracking` (for analytics, not billing)

```sql
CREATE TABLE usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id UUID REFERENCES endpoints(id),
  transaction_id UUID REFERENCES transactions(id),
  input_tokens INTEGER,
  output_tokens INTEGER,
  estimated_output_tokens INTEGER,
  actual_cost_usdc NUMERIC(20,8),
  charged_usdc NUMERIC(20,8),
  margin_usdc NUMERIC(20,8),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## API Changes

### Discovery response (new fields)

```json
{
  "url": "https://fulfill.agentgate.online/v1/code-review",
  "pricing_mode": "provider_mapped",
  "pricing": {
    "provider": "anthropic",
    "model": "claude-sonnet-4",
    "input_rate_per_1k": 0.00309,
    "output_rate_per_1k": 0.01545,
    "min_charge": 0.001,
    "markup_percent": 3
  }
}
```

For flat endpoints:
```json
{
  "url": "https://fulfill.agentgate.online/v1/email-validate",
  "pricing_mode": "flat",
  "pricing": {
    "price": 0.0005
  }
}
```

### Seller registration (new fields)

```
POST /v1/sellers/:id/endpoints
{
  "url": "...",
  "pricing_mode": "provider_mapped",
  "pricing_config": {
    "provider": "anthropic",
    "model": "claude-sonnet-4",
    "markup_percent": 3,
    "min_charge": 0.001
  }
}
```

---

## Token Counting Strategy

### For text (JSON body with prompt/code/transcript)
- **Fast path:** `Math.ceil(text.length / 4)` — good enough for pricing estimates
- **Accurate path:** Use `js-tiktoken` for exact counts (adds ~2ms)
- **Recommendation:** Fast path for 402 calculation, accurate path for usage tracking

### For audio (multipart upload)
- Estimate duration from file size: `fileSizeBytes / (128000 / 8)` = seconds at 128kbps
- Whisper charges per minute: `Math.ceil(durationSeconds / 60) * rate`

### For PDF (multipart upload)
- Estimate pages: `fileSizeBytes / 50000` (~50KB per page average)
- Estimate tokens: `pages * 500` tokens per page

---

## Implementation Order

1. **DB migration** — Add `provider_rates`, alter `endpoints`, add `usage_tracking`
2. **Seed provider rates** — Insert current rates for all major providers
3. **Token counting module** — `packages/shared/src/token-counter.ts`
4. **Dynamic pricing calculator** — `packages/shared/src/pricing.ts`
5. **Update x402 middleware** — Peek at body, calculate price, return in 402
6. **Update discovery API** — Return pricing_mode + pricing details
7. **Migrate our endpoints** — code-review → provider_mapped (anthropic/claude-sonnet-4), transcribe → provider_mapped (openai/whisper-1), etc.
8. **Usage tracking** — Log actual vs estimated tokens per request
9. **Tests** — Unit tests for pricing calculator, integration tests for dynamic 402

---

## Migration Plan for Existing Endpoints

| Endpoint | Current Price | New Mode | Config |
|----------|--------------|----------|--------|
| /v1/code-review | $0.05 flat | provider_mapped | anthropic/claude-sonnet-4, 3% markup |
| /v1/transcript-to-prd | $0.035 flat | provider_mapped | anthropic/claude-sonnet-4, 3% markup |
| /v1/transcribe | $0.015 flat | provider_mapped | openai/whisper-1, 3% markup |
| /v1/scrape-enrich | $0.012 flat | provider_mapped | openai/gpt-4.1-mini, 3% markup |
| /v1/pdf-extract | $0.02 flat | provider_mapped | google/gemini-2.5-flash, 3% markup |
| /v1/email-validate | $0.0005 flat | flat | no change |
| /v1/dns-lookup | $0.0003 flat | flat | no change |
| /v1/url-metadata | $0.0005 flat | flat | no change |
| /v1/phone-validate | $0.0003 flat | flat | no change |
| /v1/crypto-price | $0.0001 flat | flat | no change |
| /v1/ip-geolocate | $0.0002 flat | flat | no change |

---

## Open Questions

1. **Output token estimation:** Use max_tokens from request, or model default? Or offer a "max cost" cap?
2. **Refunds:** If actual output is way less than estimated, refund the difference? (Complex with x402 — settlement is final)
3. **Rate table updates:** Manual admin endpoint, or automated provider scraper?
4. **Caching pricing:** Cache provider rates in memory with TTL, or query DB every request?

---

## Success Criteria

- [ ] Any seller can register with provider_mapped pricing and auto-get competitive rates
- [ ] Dynamic 402 returns accurate prices based on input size
- [ ] Utility endpoints remain flat-priced
- [ ] Discovery API shows pricing mode and rates
- [ ] Usage tracking captures actual vs estimated for all requests
- [ ] All existing endpoints migrated without breaking changes
