# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json turbo.json tsconfig.json ./
COPY packages ./packages
COPY apps/frontend ./apps/frontend

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build argument for VITE_API_URL (defaults to Docker Hub port)
ARG VITE_API_URL=""
ENV VITE_API_URL=${VITE_API_URL}

# Build frontend and all its dependencies
RUN pnpm --filter @dxheroes/local-mcp-frontend... build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# Copy nginx configs (both variants)
# NGINX_CONF: "standalone" (default, no backend proxy - for Coolify/standalone)
#              "docker" (proxies /api to backend:3001 - for docker-compose)
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/standalone.conf /tmp/nginx-standalone.conf
COPY nginx/docker.conf /tmp/nginx-docker.conf
COPY apps/frontend/docker-entrypoint.sh /docker-entrypoint.d/40-app-config.sh
RUN chmod +x /docker-entrypoint.d/40-app-config.sh

# Select config based on build arg
ARG NGINX_CONF="standalone"
RUN cp /tmp/nginx-${NGINX_CONF}.conf /etc/nginx/conf.d/default.conf && \
    rm /tmp/nginx-*.conf

# Health check (use 127.0.0.1 to avoid IPv6 resolution issues on Alpine)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:80/health || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

