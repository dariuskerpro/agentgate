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
