# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./

# Install all deps (needed for next build); skip Playwright browsers
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
RUN npm ci 2>/dev/null || npm install

COPY . .

RUN npm run build

# Run stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy built app and runtime deps
COPY --from=builder /app/package.json ./
COPY --from=builder /app/server.js ./
COPY --from=builder /app/.next ./.next

# Production deps only
RUN npm install --omit=dev --ignore-scripts

EXPOSE 3000

CMD ["node", "server.js"]
