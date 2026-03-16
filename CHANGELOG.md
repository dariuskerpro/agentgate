# Changelog

## [Unreleased]

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
