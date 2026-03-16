# Changelog

## [Unreleased]

### AG-013: Documentation
- 6 documentation pages in `apps/web/src/content/docs/`
- Getting Started: 5-minute quickstart with `npx agentgate init`
- Middleware Reference: Config options for Express, Hono, Next.js
- Discovery API: Full API reference with request/response examples for all endpoints
- Pricing Guide: Per-category benchmarks ($0.001 data → $0.10 ML), pricing strategy
- Architecture: x402 payment flow, component overview, infrastructure choices
- FAQ: Common questions for sellers and agents
- 8 tests: file existence, content validation (npx command, endpoint paths)

### AG-012: Landing Page
- Landing page at `apps/web/src/app/page.tsx` with 5 sections
- Hero: tagline + `npx agentgate init` CTA
- HowItWorks: 3-step Install → Configure → Earn flow
- ForSellers: key benefits list (5-min setup, USDC, analytics)
- ForAgents: discovery API + code example
- Footer: docs, GitHub, community links
- `fetchEndpointCount()` API client for live marketplace stats
- 8 tests: API mock (success/failure), component export validation

### AG-010: Seller Analytics Dashboard
- Next.js App Router structure in `apps/dashboard/`
- `formatUSDC()` — formats numbers as $X.XX
- `aggregateStats()` — computes total revenue, tx count, unique wallets
- `groupByEndpoint()` — per-endpoint revenue/tx breakdown
- `groupByDay()` — daily chart data, sorted chronologically
- StatsCard, EndpointTable, RevenueChart components
- Stub dashboard page with sample transaction data
- 10 tests: formatting, aggregation, grouping, component rendering (jsdom)

### AG-009: End-to-End Integration Test Suite
- 21 integration tests across 5 suites testing components working together
- **Suite 1: Seller Onboarding Flow** (4 tests) — register → API key → endpoint → discovery, idempotent wallet registration, update flow, deactivation
- **Suite 2: Discovery Flow** (6 tests) — category filtering, keyword search, price sort, pagination (limit/offset with no overlap), categories with counts, single endpoint details
- **Suite 3: Analytics/Transaction Flow** (3 tests) — transaction recording, validation (400 on missing fields), multiple transaction storage
- **Suite 4: Auth & Security** (4 tests) — 401 without key, 401 with wrong key, public discovery (200), cross-seller 403 on update/delete
- **Suite 5: Payment Flow (Mocked)** (4 tests) — Express middleware 402 without payment header, 200 with payment, analytics fire-and-forget verification, unprotected route passthrough
- Uses Hono `app.request()` for marketplace API tests, Express + real HTTP for middleware tests
- Mock repositories for isolation, `vi.spyOn(fetch)` for analytics verification

### AG-014: Deployment Pipeline (CI/CD Configuration)
- TDD: 9 tests written first validating workflow structure, then implementation
- **CI workflow** (.github/workflows/ci.yml): lint, build, test on PR and push to main, pnpm + Node 22
- **Deploy workflow** (.github/workflows/deploy.yml): auto-deploy on merge to main
  - marketplace-api → Cloudflare Workers (wrangler)
  - dashboard → Vercel
  - web → Vercel
- **Publish workflow** (.github/workflows/publish.yml): npm publish @agentgate/middleware and CLI on version tags (v*)
- **wrangler.toml** in apps/marketplace-api/ for Cloudflare Workers + D1 config
- Updated .gitignore with .next/, .wrangler/ entries
- Added typecheck, deploy scripts to root package.json
- Added typecheck, deploy tasks to turbo.json

### AG-011: Endpoint Health Monitoring
- TDD: 12 tests written first (red), then implementation (green)
- `probeEndpoint(url)` — HEAD request with 5-second AbortController timeout, no x402 headers
- `fetchActiveEndpoints()` — retrieves only active endpoints via discover query
- `recordHealthCheck()` — stores probe results (status_code, latency_ms, is_up) in health repository
- `computeUptimeScore(endpointId)` — ratio of up checks to total (0.0–1.0)
- `shouldAutoDeactivate(endpointId)` — true when continuously down > 24 hours
- `runHealthCheck()` — orchestrator: fetch → probe → record → score → auto-deactivate
- HealthRepository interface + MockHealthRepository for testing
- Mock fetch injection in probe for deterministic tests (no real HTTP)

### AG-006: Marketplace API — Core Endpoints
- TDD: 31 tests written first (red), then implementation (green)
- Hono app assembly with route groups: sellers, endpoints, discover, events
- **Seller Management** (API key auth): POST /v1/sellers/register, GET /v1/sellers/me
- **Endpoint CRUD** (API key auth): POST/PUT/DELETE /v1/endpoints, GET /v1/endpoints/mine
- **Discovery** (public, no auth): GET /v1/discover with category/keyword/sort/pagination, GET /v1/discover/:id, GET /v1/discover/categories
- **Analytics Ingestion** (API key auth): POST /v1/events/transaction
- Auth middleware: validates `Authorization: Bearer ag_xxxxx` header, resolves seller
- Repository pattern: interfaces in types.ts, in-memory mocks for testing
- Owner-only enforcement on PUT/DELETE endpoints (403 for non-owners)
- Soft-delete on endpoints (sets active=false, excluded from discovery)
- Pagination support (limit/offset) with total count on discovery

### AG-007: Seller Registration Flow
- Wallet-based registration: POST /v1/sellers/register with wallet_address
- API key generation: `ag_` + crypto.randomUUID().replace(/-/g, '') = 32 hex chars
- Idempotent: duplicate wallet address returns existing seller + API key (200 vs 201)
- Validation: missing wallet_address returns 400
- GET /v1/sellers/me returns profile (id, wallet_address, display_name, verified)
- SIWE signature verification deferred to Phase 1 integration (accepts wallet address only for now)

### AG-008: CLI `npx agentgate init`
- TDD: 17 tests written first (red), then implementation (green)
- `detectFramework()` — auto-detects Express, Next.js, Hono from package.json deps
- `generateApiKey()` — generates `ag_` + 32 hex char unique keys
- `generateConfig()` — creates `.agentgate.json` with wallet, apiKey, routes, network (eip155:8453), facilitator URL
- `validateWalletAddress()` — validates 0x + 40 hex char Ethereum addresses
- `parseRoutePrice()` — parses `$0.001` and `0.001` formats, rejects invalid/negative
- `generateMiddlewareSnippet()` — generates framework-specific integration code (Express, Hono, Next.js)
- Interactive CLI flow: framework detection → wallet input → marketplace registration → route pricing → config generation → snippet output
- `MarketplaceClient` API client for seller registration and endpoint management
- Commander-based CLI with `agentgate init` subcommand
- Graceful fallback to local API key when marketplace is unavailable
- Dependencies: inquirer, chalk, ora, commander

### AG-001: Project Scaffolding
- Turborepo monorepo with pnpm workspaces
- TypeScript 5.x throughout all packages/apps
- Vitest for testing, Biome for linting/formatting
- turbo.json with build, test, lint, dev, clean pipelines
- Packages: `@agentgate/middleware`, `agentgate` (CLI stub), `@agentgate/sdk` (stub)
- Apps: `marketplace-api` (stub), `dashboard` (stub), `web` (stub)
- All packages compile and test successfully from root

### AG-005: Database Schema & Setup
- TDD: 33 schema validation tests written first (red), then implementation (green)
- Drizzle ORM schema with 4 tables: sellers, endpoints, transactions, endpoint_health
- Proper types: uuid PKs with gen_random_uuid(), timestamptz with NOW(), numeric(20,8) for USDC amounts, jsonb for schemas
- Foreign keys: endpoints → sellers, transactions → endpoints, endpoint_health → endpoints
- Unique constraints: sellers.wallet_address, sellers.api_key, endpoints(url, method)
- Composite primary key on endpoint_health(endpoint_id, checked_at)
- 6 indexes including partial index on active endpoints (WHERE active = TRUE)
- Database connection helper with postgres.js driver (edge-compatible)
- Drizzle config for migration generation
- Seed script: 3 sellers, 10 endpoints across data/compute/ml categories, 10 transactions

### AG-003: Hono Middleware
- TDD: 12 tests written first (red), then implementation (green)
- `agentgate()` Hono middleware with route-level x402 payment protection
- Feature parity with Express middleware (402 responses, analytics, graceful degradation)
- Cloudflare Workers compatible — no Node.js-specific APIs
- Typed without requiring Hono as a runtime dependency (optional peer dep)
- Exported from `@agentgate/middleware/hono`

### AG-004: Next.js Middleware
- TDD: 11 tests written first (red), then implementation (green)
- `withAgentGate()` wrapper for Next.js App Router route handlers
- Route-level config: wallet + price per handler (not global middleware.ts)
- Async analytics events fire on settled payments
- Config validation at init: wallet required, valid price required
- Works with async handler functions
- Exported from `@agentgate/middleware/next`

### AG-002: Express Middleware
- TDD: 18 tests written first (red), then implementation (green)
- `agentgate()` Express middleware with route-level x402 payment protection
- Returns 402 Payment Required with pricing info when no payment header present
- Unconfigured routes pass through without payment requirement
- Async analytics events fire to marketplace API on settled payments (non-blocking)
- Graceful degradation: analytics failures never block payment flow
- Config validation at init: wallet required, routes required + non-empty
- `parsePrice()` utility: handles `$0.001` and `0.001` formats, rejects invalid/negative
- Exported from both `@agentgate/middleware` and `@agentgate/middleware/express`
