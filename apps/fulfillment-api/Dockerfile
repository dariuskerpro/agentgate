FROM node:22-alpine AS base

WORKDIR /app

# Install prod dependencies
COPY package.json ./
RUN npm install --omit=dev

# Copy built output
COPY dist/ ./dist/

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "dist/index.js"]
