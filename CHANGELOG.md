# Changelog

## [Unreleased]

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
