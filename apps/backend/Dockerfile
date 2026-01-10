# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json turbo.json tsconfig.json ./
COPY packages ./packages
COPY apps/backend ./apps/backend
COPY mcp-servers ./mcp-servers

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN pnpm --filter @dxheroes/local-mcp-database prisma:generate

# Build all required packages
RUN pnpm --filter backend... build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install pnpm for production
RUN corepack enable && corepack prepare pnpm@latest --activate

# Create data directory
RUN mkdir -p /data

# Copy package files for production install
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./
COPY --from=builder /app/packages/core/package.json ./packages/core/
COPY --from=builder /app/packages/database/package.json ./packages/database/
COPY --from=builder /app/apps/backend/package.json ./apps/backend/
COPY --from=builder /app/mcp-servers ./mcp-servers

# Copy built files
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/src/generated ./packages/database/src/generated
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Set environment
ENV NODE_ENV=production
ENV PORT=3001

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start the application
WORKDIR /app/apps/backend
CMD ["node", "dist/main.js"]
