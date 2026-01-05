# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json turbo.json tsconfig.json ./
COPY packages ./packages
COPY apps/frontend ./apps/frontend

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build packages
RUN pnpm --filter "@local-mcp/core" build

# Build argument for VITE_API_URL (required at build time)
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Build frontend
RUN pnpm --filter frontend build

# Production stage
FROM nginx:alpine

# Install openssl for cert generation
RUN apk add --no-cache openssl

# Copy built files
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx/docker.conf /etc/nginx/conf.d/default.conf

# Copy entrypoint
COPY scripts/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80
EXPOSE 443

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]

