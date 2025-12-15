# Multi-stage build for SiteFast
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/server/package*.json ./packages/server/
COPY packages/web/package*.json ./packages/web/

# Install dependencies
RUN npm install --workspaces

# Copy source code
COPY packages/server ./packages/server
COPY packages/web ./packages/web

# Build both packages
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
COPY packages/server/package*.json ./packages/server/
RUN npm install --workspace=@sitefast/server --omit=dev

# Copy built server
COPY --from=builder /app/packages/server/dist ./packages/server/dist
COPY --from=builder /app/packages/web/dist ./packages/web/dist

# Create data directories
RUN mkdir -p /app/data/deployments /app/data/builds

# Set environment
ENV NODE_ENV=production
ENV DATA_DIR=/app/data
ENV PORT=3000
ENV API_PORT=3001

# Expose ports
EXPOSE 3000 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start server
CMD ["node", "packages/server/dist/index.js"]
