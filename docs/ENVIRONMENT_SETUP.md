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
| `DATABASE_URL` | PostgreSQL connection URL | `postgresql://postgres:postgres@localhost:5432/local_mcp_gateway` |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | `http://localhost:3000` |
| `LOG_LEVEL` | Logging level (error, warn, info, debug) | `info` (prod), `debug` (dev) |

### Frontend

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:3001` |

### Authentication

Auth is always enabled with email+password as the baseline method.

| Variable | Description | Default |
|----------|-------------|---------|
| `BETTER_AUTH_SECRET` | Secret for signing sessions. Generate with `openssl rand -base64 32`. Sessions won't persist across restarts without this. | Auto-generated |
| `BETTER_AUTH_URL` | Base URL for the auth server | `http://localhost:3001` |
| `FRONTEND_URL` | Frontend URL (used for invitation links and redirects) | `http://localhost:3000` |
| `AUTH_EMAIL_PASSWORD` | Enable email+password login. Set to `false` to disable. | `true` |
| `AUTH_EMAIL_PASSWORD_SIGNUP_MODE` | Email+password signup policy: `open`, `invite_only`, or `closed`. | `open` |

### Google OAuth (optional)

Enable "Sign in with Google" by setting both variables.

| Variable | Description | Default |
|----------|-------------|---------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | — |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | — |

### Email (Resend)

Required for sending organization invitation emails.

| Variable | Description | Default |
|----------|-------------|---------|
| `RESEND_API_KEY` | Resend API key from https://resend.com | — |
| `RESEND_FROM` | Sender address for emails | `Local MCP Gateway <noreply@example.com>` |

### MCP server API keys (optional)

API keys for built-in MCP server packages. These can also be configured via the UI.

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | API key for Gemini Deep Research MCP server | — |

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
