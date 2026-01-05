# Configuration Documentation

Configuration options for Local MCP Gateway.

## Overview

Local MCP Gateway can be configured through environment variables and configuration files.

---

## Documentation Index

| Document | Description |
|----------|-------------|
| [Environment Variables](./environment-variables.md) | All environment variables |

---

## Configuration Methods

### Environment Variables

Primary configuration method:

```bash
# .env file
PORT=3001
DATABASE_PATH=/custom/path/db.sqlite
OAUTH_ENCRYPTION_KEY=your-key
```

### Configuration Files

Application-specific config files:
- `turbo.json` - Turborepo configuration
- `tsconfig.json` - TypeScript configuration
- `drizzle.config.ts` - Database configuration

---

## Quick Reference

### Essential Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 3001 | Backend server port |
| `OAUTH_ENCRYPTION_KEY` | Yes* | - | Token encryption key |
| `DATABASE_PATH` | No | `~/.local-mcp-gateway-data/...` | Database location |

*Required if using OAuth

### Generate Encryption Key

```bash
openssl rand -hex 32
```

---

## Environment Files

### Development

Create `.env` in project root:

```bash
NODE_ENV=development
PORT=3001
LOG_LEVEL=debug
```

### Production

```bash
NODE_ENV=production
PORT=3001
OAUTH_ENCRYPTION_KEY=your-secure-key
ALLOWED_ORIGINS=https://your-domain.com
```

---

## Configuration by Component

### Backend

| Variable | Description |
|----------|-------------|
| `PORT` | HTTP server port |
| `HOST` | Bind address |
| `LOG_LEVEL` | Logging verbosity |
| `CORS_ORIGINS` | Allowed CORS origins |

### Database

| Variable | Description |
|----------|-------------|
| `DATABASE_PATH` | SQLite file path |

### OAuth

| Variable | Description |
|----------|-------------|
| `OAUTH_ENCRYPTION_KEY` | Token encryption |
| `OAUTH_REDIRECT_BASE` | Callback base URL |

### Frontend

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL |
| `VITE_APP_NAME` | Application name |

---

## Validation

### Required Variables

Some variables are required in production:

```typescript
function validateConfig() {
  if (!process.env.OAUTH_ENCRYPTION_KEY && hasOAuthServers()) {
    throw new Error('OAUTH_ENCRYPTION_KEY required for OAuth servers');
  }
}
```

### Type Validation

Environment variables are typed:

```typescript
const config = {
  port: parseInt(process.env.PORT || '3001'),
  logLevel: process.env.LOG_LEVEL || 'info',
  debug: process.env.DEBUG === 'true'
};
```

---

## See Also

- [Environment Variables](./environment-variables.md) - Complete reference
- [Development Setup](../../contributing/development-setup.md) - Dev configuration
- [Production Checklist](../deployment/production-checklist.md) - Production config
