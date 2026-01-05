# Environment Variables

Complete reference for all environment variables.

## Overview

Environment variables configure Local MCP Gateway behavior. Set them in a `.env` file or your shell environment.

---

## Server Configuration

### PORT

```bash
PORT=3001
```

| Property | Value |
|----------|-------|
| Default | `3001` |
| Required | No |
| Description | HTTP server port |

### HOST

```bash
HOST=0.0.0.0
```

| Property | Value |
|----------|-------|
| Default | `localhost` |
| Required | No |
| Description | Server bind address |

### NODE_ENV

```bash
NODE_ENV=production
```

| Property | Value |
|----------|-------|
| Default | `development` |
| Values | `development`, `production`, `test` |
| Description | Runtime environment |

---

## Database Configuration

### DATABASE_PATH

```bash
DATABASE_PATH=/custom/path/database.db
```

| Property | Value |
|----------|-------|
| Default | `~/.local-mcp-gateway-data/local-mcp-gateway.db` |
| Required | No |
| Description | SQLite database file path |

### DATABASE_URL

```bash
DATABASE_URL=file:./data/app.db
```

| Property | Value |
|----------|-------|
| Default | - |
| Required | No |
| Description | Alternative database URL format |

---

## OAuth Configuration

### OAUTH_ENCRYPTION_KEY

```bash
OAUTH_ENCRYPTION_KEY=your-64-character-hex-key
```

| Property | Value |
|----------|-------|
| Default | - |
| Required | Yes (if using OAuth) |
| Description | AES-256 encryption key for OAuth tokens |

**Generate:**
```bash
openssl rand -hex 32
```

### OAUTH_REDIRECT_BASE

```bash
OAUTH_REDIRECT_BASE=https://your-domain.com
```

| Property | Value |
|----------|-------|
| Default | `http://localhost:3001` |
| Required | No |
| Description | Base URL for OAuth callbacks |

---

## CORS Configuration

### ALLOWED_ORIGINS

```bash
ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com
```

| Property | Value |
|----------|-------|
| Default | `*` (development) |
| Required | No (recommended in production) |
| Description | Comma-separated allowed origins |

### CORS_CREDENTIALS

```bash
CORS_CREDENTIALS=true
```

| Property | Value |
|----------|-------|
| Default | `true` |
| Required | No |
| Description | Allow credentials in CORS |

---

## Logging Configuration

### LOG_LEVEL

```bash
LOG_LEVEL=debug
```

| Property | Value |
|----------|-------|
| Default | `info` |
| Values | `error`, `warn`, `info`, `debug`, `trace` |
| Description | Logging verbosity |

### LOG_FORMAT

```bash
LOG_FORMAT=json
```

| Property | Value |
|----------|-------|
| Default | `pretty` (dev), `json` (prod) |
| Values | `pretty`, `json` |
| Description | Log output format |

---

## Debug Configuration

### DEBUG_LOG_BUFFER_SIZE

```bash
DEBUG_LOG_BUFFER_SIZE=1000
```

| Property | Value |
|----------|-------|
| Default | `500` |
| Required | No |
| Description | Max debug log entries in memory |

### DEBUG_LOG_LEVEL

```bash
DEBUG_LOG_LEVEL=verbose
```

| Property | Value |
|----------|-------|
| Default | `normal` |
| Values | `minimal`, `normal`, `verbose` |
| Description | Debug log detail level |

---

## Rate Limiting

### RATE_LIMIT_WINDOW

```bash
RATE_LIMIT_WINDOW=60000
```

| Property | Value |
|----------|-------|
| Default | `60000` (1 minute) |
| Required | No |
| Description | Rate limit window in milliseconds |

### RATE_LIMIT_MAX

```bash
RATE_LIMIT_MAX=100
```

| Property | Value |
|----------|-------|
| Default | `100` |
| Required | No |
| Description | Max requests per window |

---

## HTTPS / Tunneling

### HTTPS_TUNNEL

```bash
HTTPS_TUNNEL=true
```

| Property | Value |
|----------|-------|
| Default | `false` |
| Required | No |
| Description | Enable HTTPS tunneling |

### TUNNEL_PROVIDER

```bash
TUNNEL_PROVIDER=cloudflare
```

| Property | Value |
|----------|-------|
| Default | `cloudflare` |
| Values | `cloudflare`, `ngrok`, `localtunnel` |
| Description | Tunnel provider |

### CLOUDFLARE_TUNNEL_TOKEN

```bash
CLOUDFLARE_TUNNEL_TOKEN=your-token
```

| Property | Value |
|----------|-------|
| Default | - |
| Required | If using Cloudflare tunnel |
| Description | Cloudflare tunnel authentication |

---

## Frontend Configuration

### VITE_API_URL

```bash
VITE_API_URL=http://localhost:3001
```

| Property | Value |
|----------|-------|
| Default | `http://localhost:3001` |
| Required | No |
| Description | Backend API URL for frontend |

### VITE_APP_NAME

```bash
VITE_APP_NAME=Local MCP Gateway
```

| Property | Value |
|----------|-------|
| Default | `Local MCP Gateway` |
| Required | No |
| Description | Application display name |

---

## Example Configurations

### Development

```bash
# .env
NODE_ENV=development
PORT=3001
LOG_LEVEL=debug

# Optional OAuth (for testing)
OAUTH_ENCRYPTION_KEY=dev-key-for-testing-only-32chars!

# Debug
DEBUG_LOG_LEVEL=verbose
```

### Production

```bash
# .env.production
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# Security
OAUTH_ENCRYPTION_KEY=<generate-with-openssl-rand-hex-32>
ALLOWED_ORIGINS=https://your-domain.com

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Rate limiting
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX=100
```

### Docker

```bash
# docker-compose.yml environment
NODE_ENV=production
PORT=3001
DATABASE_PATH=/data/local-mcp-gateway.db
OAUTH_ENCRYPTION_KEY=${OAUTH_ENCRYPTION_KEY}
```

---

## Variable Precedence

1. Command line arguments (highest)
2. Environment variables
3. `.env.local` file
4. `.env.{NODE_ENV}` file
5. `.env` file
6. Default values (lowest)

---

## See Also

- [Configuration README](./README.md) - Configuration overview
- [Development Setup](../../contributing/development-setup.md) - Dev environment
- [Docker Deployment](../deployment/docker.md) - Docker configuration
