# Docker Deployment

Guide for deploying Local MCP Gateway with Docker.

## Overview

Docker provides consistent, isolated deployment for Local MCP Gateway.

---

## Quick Start

### Pull and Run

```bash
docker pull dxheroes/local-mcp-gateway:latest
docker run -p 3001:3001 -p 3000:3000 dxheroes/local-mcp-gateway
```

### With Data Persistence

```bash
docker run -d \
  --name local-mcp-gateway \
  -p 3001:3001 \
  -p 3000:3000 \
  -v local-mcp-data:/data \
  -e DATABASE_PATH=/data/local-mcp-gateway.db \
  -e OAUTH_ENCRYPTION_KEY=your-key \
  dxheroes/local-mcp-gateway
```

---

## Docker Compose

### Basic Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  local-mcp-gateway:
    image: dxheroes/local-mcp-gateway:latest
    ports:
      - "3001:3001"
      - "3000:3000"
    volumes:
      - local-mcp-data:/data
    environment:
      - NODE_ENV=production
      - DATABASE_PATH=/data/local-mcp-gateway.db
      - OAUTH_ENCRYPTION_KEY=${OAUTH_ENCRYPTION_KEY}
    restart: unless-stopped

volumes:
  local-mcp-data:
```

### With Reverse Proxy

```yaml
# docker-compose.yml
version: '3.8'

services:
  local-mcp-gateway:
    image: dxheroes/local-mcp-gateway:latest
    expose:
      - "3001"
      - "3000"
    volumes:
      - local-mcp-data:/data
    environment:
      - NODE_ENV=production
      - DATABASE_PATH=/data/local-mcp-gateway.db
      - OAUTH_ENCRYPTION_KEY=${OAUTH_ENCRYPTION_KEY}
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on:
      - local-mcp-gateway
    restart: unless-stopped

volumes:
  local-mcp-data:
```

### Nginx Configuration

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server local-mcp-gateway:3001;
    }

    upstream frontend {
        server local-mcp-gateway:3000;
    }

    server {
        listen 80;
        server_name localhost;

        location /api {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
        }

        location /mcp {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_buffering off;
        }

        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
        }
    }
}
```

---

## Building from Source

### Dockerfile

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/*/package.json ./packages/
COPY apps/*/package.json ./apps/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build
RUN pnpm build

# Production image
FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy built files
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps ./apps

# Create data directory
RUN mkdir -p /data

# Environment
ENV NODE_ENV=production
ENV PORT=3001
ENV DATABASE_PATH=/data/local-mcp-gateway.db

EXPOSE 3001 3000

CMD ["pnpm", "start"]
```

### Build Command

```bash
docker build -t local-mcp-gateway .
```

---

## Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `OAUTH_ENCRYPTION_KEY` | Token encryption key |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3001 | Backend port |
| `DATABASE_PATH` | `/data/local-mcp-gateway.db` | Database path |
| `NODE_ENV` | production | Environment |
| `LOG_LEVEL` | info | Logging level |

### Using .env File

```bash
docker run --env-file .env dxheroes/local-mcp-gateway
```

---

## Data Management

### Volumes

```yaml
volumes:
  - local-mcp-data:/data           # Named volume
  - ./data:/data                   # Bind mount
  - /path/on/host:/data           # Absolute path
```

### Backup

```bash
# Stop container
docker stop local-mcp-gateway

# Backup volume
docker run --rm \
  -v local-mcp-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/mcp-backup.tar.gz /data

# Start container
docker start local-mcp-gateway
```

### Restore

```bash
docker run --rm \
  -v local-mcp-data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/mcp-backup.tar.gz -C /
```

---

## Health Checks

### Docker Health Check

```yaml
services:
  local-mcp-gateway:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### Kubernetes Probes

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3001
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health
    port: 3001
  initialDelaySeconds: 5
  periodSeconds: 5
```

---

## Networking

### Bridge Network (Default)

```bash
docker run -p 3001:3001 -p 3000:3000 dxheroes/local-mcp-gateway
```

### Custom Network

```yaml
networks:
  mcp-network:
    driver: bridge

services:
  local-mcp-gateway:
    networks:
      - mcp-network
```

### Host Network

```bash
docker run --network host dxheroes/local-mcp-gateway
```

---

## Logging

### View Logs

```bash
docker logs local-mcp-gateway
docker logs -f local-mcp-gateway  # Follow
docker logs --tail 100 local-mcp-gateway  # Last 100 lines
```

### Log Configuration

```yaml
services:
  local-mcp-gateway:
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
```

---

## Resource Limits

```yaml
services:
  local-mcp-gateway:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs local-mcp-gateway

# Interactive debug
docker run -it --entrypoint /bin/sh dxheroes/local-mcp-gateway
```

### Permission Issues

```bash
# Fix volume permissions
docker run --rm \
  -v local-mcp-data:/data \
  alpine chown -R 1000:1000 /data
```

### Database Locked

Ensure only one container accesses the database:

```bash
docker ps | grep local-mcp-gateway
docker stop <old-container>
```

---

## See Also

- [Production Checklist](./production-checklist.md) - Production setup
- [Environment Variables](../configuration/environment-variables.md) - Configuration
- [Deployment README](./README.md) - Deployment overview
