FROM node:22-slim AS builder
WORKDIR /app

# Copy package files for install
COPY package.json ./
RUN npm install --legacy-peer-deps

# Copy source and tsconfig
COPY tsconfig.json ./
COPY src/ ./src/

# Use a local tsconfig that doesn't extend (standalone Docker build)
RUN echo '{"compilerOptions":{"target":"ES2022","module":"NodeNext","moduleResolution":"NodeNext","outDir":"dist","rootDir":"src","strict":true,"esModuleInterop":true,"skipLibCheck":true,"declaration":true,"declarationMap":true,"sourceMap":true},"include":["src"],"exclude":["node_modules","dist"]}' > tsconfig.build.json
RUN npx tsc -p tsconfig.build.json

# ── Production ──────────────────────────────────────────────
FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4022

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
RUN npm install --omit=dev --legacy-peer-deps

EXPOSE 4022
CMD ["node", "dist/index.js"]
