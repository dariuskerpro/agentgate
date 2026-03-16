# AgentGate System Checklist

**Domain:** agentgate.online
**Last verified:** 2026-03-16 16:54 PDT

---

## 1. DNS Resolution ✅
| Record | Target | Status |
|--------|--------|--------|
| `agentgate.online` | 64.225.88.228 | ✅ |
| `api.agentgate.online` | 64.225.88.228 | ✅ |
| `fulfill.agentgate.online` | 64.225.88.228 | ✅ |
| `docs.agentgate.online` | 64.225.88.228 | ✅ |

## 2. SSL Certificates ✅
| Domain | Expires | Status |
|--------|---------|--------|
| `agentgate.online` | Jun 14, 2026 | ✅ Let's Encrypt |
| `api.agentgate.online` | Jun 14, 2026 | ✅ Let's Encrypt |
| `fulfill.agentgate.online` | Jun 14, 2026 | ✅ Let's Encrypt |

## 3. Landing Page ✅
- HTTPS: 200 ✅
- AgentGate branding present ✅
- Zero text2ai.com references ✅
- `/marketplace` → 200 (via 301 trailing slash) ✅
- `/docs` → 200 (via 301 trailing slash) ✅

## 4. Marketplace API ✅
- `GET /health` → 200 `{"status":"ok"}` ✅
- `GET /v1/discover` → 11 endpoints ✅
- `GET /v1/discover/categories` → 4 categories ✅
- All endpoint URLs use `fulfill.agentgate.online` ✅
- Zero text2ai.com URLs in database ✅

## 5. Fulfillment API ✅
- `GET /health` → 200, payments enabled ✅
- Networks: Base mainnet (eip155:8453) + Solana mainnet ✅
- Facilitator: `facilitator-production-ad50.up.railway.app` ✅

## 6. x402 Payment Gates — All 11 Endpoints ✅

| Endpoint | Price | 402 Status |
|----------|-------|------------|
| `/v1/email-validate` | $0.0005 | ✅ 402 |
| `/v1/dns-lookup` | $0.0003 | ✅ 402 |
| `/v1/url-metadata` | $0.0005 | ✅ 402 |
| `/v1/phone-validate` | $0.0003 | ✅ 402 |
| `/v1/crypto-price` | $0.0001 | ✅ 402 |
| `/v1/ip-geolocate` | $0.0002 | ✅ 402 |
| `/v1/code-review` | $0.05 | ✅ 402 |
| `/v1/transcript-to-prd` | $0.035 | ✅ 402 |
| `/v1/transcribe` | $0.015 | ✅ 402 |
| `/v1/scrape-enrich` | $0.012 | ✅ 402 |
| `/v1/pdf-extract` | $0.02 | ✅ 402 |

## 7. Facilitator ✅
- 4 networks: Base mainnet, Base Sepolia, Solana mainnet, Solana devnet
- EVM signer: `0xA03D6bF0...`
- SOL signer: `2mUNgWRnsc...`

## 8. x402 Payment Header ✅
- x402 version: 2
- Dual-chain: Base mainnet + Solana mainnet
- Both chains return correct wallet addresses
- USDC contract addresses verified (Base: `0x8335...`, Solana SPL: `EPjF...`)

## 9. Codebase ✅
- Zero `text2ai` references in source files ✅
- 19/19 monorepo build+test tasks passing ✅
- 10/10 Python tests passing (1 skipped — CrewAI optional) ✅
- Branch: `main`, synced with `origin/main`
- Rollback branch: `pre-domain-migration`

## 10. Infrastructure
| Service | Platform | URL |
|---------|----------|-----|
| Marketplace API | Railway | `agentgate-production-3bf2.up.railway.app` |
| Fulfillment API | Railway | `fulfillment-api-production.up.railway.app` |
| Facilitator | Railway | `facilitator-production-ad50.up.railway.app` |
| Landing Page | Plesk/DO | `64.225.88.228` |
| Database | Supabase | `aws-1-us-west-1.pooler.supabase.com` |

## How to Re-run This Checklist

```bash
# Quick smoke test
curl -s https://agentgate.online | head -1
curl -s https://api.agentgate.online/health
curl -s https://fulfill.agentgate.online/health
curl -s -o /dev/null -w "%{http_code}" -X POST https://fulfill.agentgate.online/v1/email-validate -H "Content-Type: application/json" -d '{"email":"test@gmail.com"}'
```

Expected: HTML content, `{"status":"ok"}`, `{"status":"ok","payments":true,...}`, `402`
