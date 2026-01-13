# Environment Configuration Guide

This guide explains how to configure environment variables for Local MCP Gateway.

## Quick Start

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Start development:
   ```bash
   pnpm dev
   ```

## Architecture

### How It Works

1. **Turborepo** loads `.env` from the root directory via `globalDotEnv` directive
2. **Backend** reads `process.env` directly (validated with Zod schema)
3. **Frontend** uses Vite's native env handling (variables prefixed with `VITE_`)
4. **Docker** uses `.env.docker` for container-specific configuration

### File Structure

```
local-mcp-gateway/
├── .env                    # Your local configuration (gitignored)
├── .env.example            # Template with all available variables
├── .env.docker             # Docker-specific defaults
└── turbo.json              # Turborepo loads .env here (globalDotEnv)
```

## Available Variables

### Backend

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Backend server port | `3001` |
| `DATABASE_URL` | SQLite database path | `file:./dev.db` |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | `http://localhost:3000` |
| `LOG_LEVEL` | Logging level (error, warn, info, debug) | `info` (prod), `debug` (dev) |
| `OAUTH_ENCRYPTION_KEY` | Encryption key for OAuth tokens (32+ chars) | Required for OAuth |

### Frontend

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:3001` |

## Common Scenarios

### Changing Backend Port

Update **both** variables in `.env`:
```env
PORT=3002
VITE_API_URL=http://localhost:3002
```

Then restart dev server:
```bash
pnpm dev
```

### Running HTTPS Development

Use the pre-configured HTTPS mode:
```bash
pnpm dev:https
```

### Docker Production

1. Edit `.env.docker` with your configuration
2. Run:
   ```bash
   docker-compose up
   ```

## Troubleshooting

### Frontend can't connect to backend

1. Verify `VITE_API_URL` matches backend `PORT`
2. Check `CORS_ORIGINS` includes frontend URL
3. Restart dev server (Vite caches env vars at startup)

### Environment changes not applied

```bash
# Clear Turborepo cache
pnpm turbo clean
pnpm dev
```

## Security Best Practices

1. **Never commit secrets** - Use `.env.example` templates only
2. **Use HTTPS in production** - Especially for OAuth flows
3. **Rotate secrets regularly** - Update production secrets periodically

## References

- [Turborepo Environment Variables](https://turbo.build/repo/docs/handbook/environment-variables)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Docker Compose Environment](https://docs.docker.com/compose/environment-variables/)
