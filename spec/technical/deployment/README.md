# Deployment Documentation

Deployment options and guides for Local MCP Gateway.

## Overview

Local MCP Gateway can be deployed in various configurations from local development to production environments.

---

## Documentation Index

| Document | Description |
|----------|-------------|
| [Docker](./docker.md) | Docker deployment |
| [Production Checklist](./production-checklist.md) | Production readiness |

---

## Deployment Options

| Option | Use Case | Complexity |
|--------|----------|------------|
| Local Development | Development, testing | Low |
| Docker | Containerized deployment | Medium |
| Docker Compose | Multi-container setup | Medium |
| Cloud | Production hosting | High |

---

## Quick Start

### Local Development

```bash
git clone https://github.com/DXHeroes/local-mcp-gateway.git
cd local-mcp-gateway
pnpm install
pnpm dev
```

### Docker

```bash
docker pull dxheroes/local-mcp-gateway
docker run -p 3001:3001 -p 3000:3000 dxheroes/local-mcp-gateway
```

### Docker Compose

```bash
curl -O https://raw.githubusercontent.com/DXHeroes/local-mcp-gateway/main/docker-compose.yml
docker-compose up -d
```

---

## Architecture Overview

### Single Instance

```
┌─────────────────────────────────────────┐
│           Local MCP Gateway             │
│  ┌─────────────┐  ┌─────────────────┐  │
│  │   Backend   │  │    Frontend     │  │
│  │   :3001     │  │     :3000       │  │
│  └─────────────┘  └─────────────────┘  │
│  ┌─────────────────────────────────────┐│
│  │            SQLite DB                ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

### With Reverse Proxy

```
                    Internet
                        │
                        ▼
            ┌───────────────────┐
            │   Reverse Proxy   │
            │  (nginx/caddy)    │
            │   HTTPS :443      │
            └───────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌───────────────┐ ┌───────────┐ ┌───────────┐
│    Backend    │ │  Frontend │ │   Static  │
│    :3001      │ │   :3000   │ │   Files   │
└───────────────┘ └───────────┘ └───────────┘
```

---

## Port Configuration

| Port | Service | Description |
|------|---------|-------------|
| 3000 | Frontend | Web UI |
| 3001 | Backend | API + MCP Proxy |

### Custom Ports

```bash
PORT=8080 FRONTEND_PORT=8081 pnpm dev
```

---

## Data Persistence

### Default Location

```bash
~/.local-mcp-gateway-data/
├── local-mcp-gateway.db      # Main database
├── local-mcp-gateway.db-wal  # Write-ahead log
└── local-mcp-gateway.db-shm  # Shared memory
```

### Custom Location

```bash
DATABASE_PATH=/custom/path/database.db
```

### Docker Volumes

```yaml
volumes:
  - ./data:/data
environment:
  - DATABASE_PATH=/data/local-mcp-gateway.db
```

---

## Environment Modes

### Development

```bash
NODE_ENV=development pnpm dev
```

Features:
- Hot reload
- Debug logging
- Permissive CORS
- No rate limiting

### Production

```bash
NODE_ENV=production pnpm start
```

Features:
- Optimized builds
- Structured logging
- Strict CORS
- Rate limiting enabled

---

## Health Checks

### Backend Health

```bash
curl http://localhost:3001/health
```

Response:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "uptime": 12345
}
```

### Frontend Health

```bash
curl http://localhost:3000/
```

---

## Scaling Considerations

### Single User Design

Local MCP Gateway is designed for single-user use:
- No multi-tenant isolation
- SQLite single-writer limitation
- Session state in memory

### For Multiple Users

Consider:
- Separate instances per user
- PostgreSQL for shared database
- Redis for session storage

---

## Security Checklist

- [ ] Set `OAUTH_ENCRYPTION_KEY`
- [ ] Configure `ALLOWED_ORIGINS`
- [ ] Enable HTTPS
- [ ] Set up rate limiting
- [ ] Review MCP server configurations
- [ ] Secure database file permissions

---

## See Also

- [Docker](./docker.md) - Docker deployment guide
- [Production Checklist](./production-checklist.md) - Production setup
- [Environment Variables](../configuration/environment-variables.md) - Configuration
