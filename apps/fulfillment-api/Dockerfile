FROM node:22-slim AS builder
WORKDIR /app

# Copy package files for install
COPY package.json ./
RUN npm install

# Copy source and tsconfig
COPY tsconfig.json ./
COPY src/ ./src/

# Need the base tsconfig from monorepo root
# Since we're in rootDirectory mode, we need to handle this
# Use a local tsconfig that doesn't extend
RUN echo '{"compilerOptions":{"target":"ES2022","module":"NodeNext","moduleResolution":"NodeNext","outDir":"dist","rootDir":"src","strict":true,"esModuleInterop":true,"skipLibCheck":true,"declaration":true,"declarationMap":true,"sourceMap":true},"include":["src"],"exclude":["node_modules","dist","src/__tests__"]}' > tsconfig.build.json
RUN npx tsc -p tsconfig.build.json

# ── Production ──────────────────────────────────────────────
FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
RUN npm install --omit=dev

EXPOSE 3001
CMD ["node", "dist/index.js"]
