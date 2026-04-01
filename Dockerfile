# Production-ready Dockerfile for alphabag-v2
# Pre-built: dist/ already contains compiled frontend + server
FROM node:22-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.4.1

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy pre-built dist (frontend + server bundle)
COPY dist ./dist

# Copy drizzle migrations
COPY drizzle ./drizzle

# Copy server source (for any runtime imports)
COPY server ./server
COPY shared ./shared

EXPOSE 3000

ENV NODE_ENV=production

# Server bundle is at dist/index.js (from esbuild)
CMD ["node", "dist/index.js"]
