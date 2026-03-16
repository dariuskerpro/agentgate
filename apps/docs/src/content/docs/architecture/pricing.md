---
sidebar:
  order: 3
title: Pricing Guide
description: How to price your API endpoints
---

Pricing per-call APIs is different from SaaS subscriptions. You're charging for individual units of work, so the price needs to reflect actual cost plus margin.

## Pricing tiers

| Tier | Price Range | What it covers | Examples |
|------|------------|----------------|----------|
| **Utility** | $0.0001 – $0.001 | Simple lookups, validations, no external API cost | DNS lookup, email validation, IP geolocation, crypto price |
| **Data** | $0.001 – $0.02 | Web scraping, API aggregation, moderate compute | URL metadata, scrape + enrich, PDF extraction |
| **AI Inference** | $0.02 – $0.10 | LLM calls, model inference, GPU time | Code review, transcription, transcript-to-PRD |
| **Pipeline** | $0.10 – $1.00 | Multi-step workflows, chained AI calls, heavy compute | Full project scaffolding, codebase migration |

## How to set your price

### 1. Calculate your cost per call

Add up everything a single request costs you:

- **API costs** — If you call OpenAI, Anthropic, or Google, what does one call cost?
- **Compute** — CPU/GPU time, memory, bandwidth
- **Infrastructure** — Server costs amortized per request
- **Third-party data** — Any paid data sources you use

### 2. Add margin

A 2x–5x markup over cost is typical:

| Your cost | Suggested price | Margin |
|-----------|----------------|--------|
| $0.0001 | $0.0003 | 3x |
| $0.005 | $0.012 | 2.4x |
| $0.02 | $0.05 | 2.5x |

### 3. Consider the buyer's alternative

What would it cost the buyer to do this themselves?

- Setting up a transcription pipeline: hours of engineering time
- Running their own code review model: GPU costs + maintenance
- Building a web scraper: reliability, anti-bot measures, maintenance

If your endpoint saves them significant effort, you can price higher.

## AgentGate's live pricing

Here's how the current endpoints are priced, with cost rationale:

| Endpoint | Price | Cost basis |
|----------|-------|-----------|
| `/v1/crypto-price` | $0.0001 | Free API call, minimal compute |
| `/v1/ip-geolocate` | $0.0002 | Free DB lookup, minimal compute |
| `/v1/email-validate` | $0.0003 | DNS MX check, minimal compute |
| `/v1/dns-lookup` | $0.0003 | DNS resolution, minimal compute |
| `/v1/phone-validate` | $0.0003 | Regex + lookup, minimal compute |
| `/v1/url-metadata` | $0.0005 | HTTP fetch + parse, light compute |
| `/v1/scrape-enrich` | $0.012 | HTTP fetch + optional AI enrichment |
| `/v1/transcribe` | $0.015 | Whisper API call (~$0.006/min) |
| `/v1/pdf-extract` | $0.02 | Gemini API call for extraction |
| `/v1/transcript-to-prd` | $0.035 | LLM call (Anthropic/OpenAI) |
| `/v1/code-review` | $0.05 | LLM call with large context window |

## Pricing strategy tips

**Start low, raise later.** It's easier to raise prices on a popular endpoint than to find users at a high price point. Early adopters get a deal, and you get usage data.

**Watch your margins.** If an LLM provider raises prices, your margins shrink. Build in enough headroom to absorb cost changes.

**Don't price below cost.** Even for utility endpoints, make sure you're covering infrastructure costs. $0.0001 per call adds up when you're doing millions.

**Consider volume.** A $0.001 endpoint doing 100K calls/day is $100/day revenue. A $0.10 endpoint doing 100 calls/day is $10/day. Price for the volume you expect.

**Bundle strategically.** If you have a pipeline that chains multiple steps, price the pipeline endpoint higher than the sum of individual steps — you're selling convenience and reliability.

## Payment settlement

- Payments are in **USDC** (stablecoin pegged to $1 USD)
- Settlement happens **per-request** — no batching, no delayed payouts
- Funds go directly to **your wallet** on Base or Solana
- No AgentGate commission on self-hosted endpoints
- Marketplace-listed endpoints may have a platform fee (TBD)
