# ── Stage 1: Pruned monorepo ──────────────────────────────────
FROM node:22-slim AS pruner
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate
WORKDIR /app
COPY . .
# Invalidate cache: 2026-03-16T19:30
RUN echo "cache-bust-20260316" > /tmp/.cache-bust
RUN npx turbo prune @agent-gate/marketplace-api --docker

# ── Stage 2: Install + Build ─────────────────────────────────
FROM node:22-slim AS builder
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate
WORKDIR /app

# Install dependencies (lockfile + pruned package.jsons only → cached layer)
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY --from=pruner /app/out/full/ .
# turbo prune doesn't always include root config files — copy explicitly
COPY --from=pruner /app/tsconfig.base.json ./tsconfig.base.json
RUN pnpm turbo build --filter=@agent-gate/marketplace-api

# ── Stage 3: Production runtime ──────────────────────────────
FROM node:22-slim AS runner
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy only what's needed at runtime
COPY --from=builder /app/apps/marketplace-api/dist ./apps/marketplace-api/dist
COPY --from=builder /app/apps/marketplace-api/package.json ./apps/marketplace-api/
COPY --from=builder /app/apps/marketplace-api/drizzle ./apps/marketplace-api/drizzle
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/marketplace-api/node_modules ./apps/marketplace-api/node_modules

EXPOSE 3000

WORKDIR /app/apps/marketplace-api
CMD ["node", "dist/server.js"]
