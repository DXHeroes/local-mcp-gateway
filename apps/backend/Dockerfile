# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json turbo.json tsconfig.json ./
COPY packages ./packages
COPY apps/backend ./apps/backend

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build packages
RUN pnpm --filter "@dxheroes/local-mcp-core" build
RUN pnpm --filter "@dxheroes/local-mcp-database" build
RUN pnpm --filter "@dxheroes/local-mcp-custom-mcp-loader" build

# Build backend
RUN pnpm --filter backend build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/core/package.json ./packages/core/
COPY packages/database/package.json ./packages/database/
COPY packages/custom-mcp-loader/package.json ./packages/custom-mcp-loader/
COPY apps/backend/package.json ./apps/backend/

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built files
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/custom-mcp-loader/dist ./packages/custom-mcp-loader/dist
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

# Copy custom-mcps directory
COPY custom-mcps ./custom-mcps

WORKDIR /app/apps/backend

EXPOSE 3001

CMD ["node", "dist/index.js"]

