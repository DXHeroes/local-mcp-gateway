# Environment Configuration Guide

This monorepo uses centralized environment configuration managed by Turborepo.

## Quick Start

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Generate required secrets:
   ```bash
   # Better Auth secret (required)
   openssl rand -hex 32
   ```

3. Update `.env` with your values:
   - Set `BETTER_AUTH_SECRET` to the generated secret
   - Configure optional services (OAuth, email, payments, etc.)

4. Start development:
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
├── turbo.json              # Turborepo loads .env here (globalDotEnv)
├── apps/
│   ├── backend/
│   │   └── src/lib/env.ts  # Zod validation schema
│   └── frontend/
│       └── .env.https      # Optional: HTTPS dev mode overrides
└── docker-compose.yml      # Docker env configuration
```

### Environment Loading Priority

#### Development (local)
1. Root `.env` file
2. Turborepo injects vars into all tasks via `globalDotEnv`
3. Backend: Zod validates `process.env`
4. Frontend: Vite reads `VITE_*` prefixed vars

#### Docker
1. `.env.docker` (defaults)
2. `docker-compose.yml` `env_file` directive
3. `docker-compose.yml` `environment` overrides (highest priority)

## Available Variables

### Backend (Required)

- `BETTER_AUTH_SECRET` - Auth secret key (min 32 chars)
  ```bash
  # Generate with:
  openssl rand -hex 32
  ```

### Backend (Optional)

- `NODE_ENV` - Environment (development|production|test) - default: development
- `PORT` - Backend port - default: 3001
- `DATABASE_PATH` - SQLite database path - default: ~/.local-mcp-data/local-mcp.db
- `CORS_ORIGINS` - Allowed CORS origins (comma-separated) - default: http://localhost:3000
- `LOG_LEVEL` - Logging level (error|warn|info|debug) - default: info (prod), debug (dev)
- `BETTER_AUTH_URL` - Auth base URL - default: http://localhost:3001
- `RESEND_API_KEY` - Email service API key (https://resend.com - 100 emails/day free)
- `EMAIL_FROM` - Email sender address - default: Local MCP Gateway <noreply@local-mcp.dev>
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - Google OAuth credentials
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` - GitHub OAuth credentials
- `OAUTH_ENCRYPTION_KEY` - OAuth encryption key (min 32 chars)
- `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET` - Paddle payment provider
- `PADDLE_ENVIRONMENT` - sandbox|production - default: sandbox
- `LICENSE_PRIVATE_KEY`, `LICENSE_PUBLIC_KEY` - License signing keys (64 hex chars each)
- `SENTRY_DSN` - Sentry error tracking URL

### Frontend

- `VITE_API_URL` - Backend API URL - **must match `PORT`**
  - Development: `http://localhost:3001`
  - Production: Set according to deployment
  - Docker: `http://backend:3001` (internal network)

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

This uses `apps/frontend/.env.https` with `VITE_API_URL=https://localhost:3002`.

To customize, edit `apps/frontend/.env.https`:
```env
VITE_API_URL=https://your-custom-url:port
```

### Docker Production

#### Option 1: Use .env.docker

1. Edit `.env.docker` with your configuration
2. Set secrets via environment variables:
   ```bash
   export BETTER_AUTH_SECRET=$(openssl rand -hex 32)
   docker-compose up
   ```

#### Option 2: Override in docker-compose.yml

```yaml
services:
  backend:
    environment:
      - BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
      - RESEND_API_KEY=${RESEND_API_KEY}
```

Then:
```bash
docker-compose up
```

### CI/CD

Set environment variables in your CI/CD platform:
- **GitHub Actions**: Repository Secrets
- **GitLab CI**: CI/CD Variables
- **Docker**: Environment variables or secrets

**DO NOT** commit `.env` with real secrets to git.

Example GitHub Actions:
```yaml
env:
  BETTER_AUTH_SECRET: ${{ secrets.BETTER_AUTH_SECRET }}
  RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
```

## Validation

Backend validates all environment variables using Zod schema at startup.

**Location**: `apps/backend/src/lib/env.ts`

**Process**:
1. Reads `process.env` (populated by Turborepo from root `.env`)
2. Validates against Zod schema
3. Fails fast with clear error messages if invalid

**Example error**:
```
Environment variable validation failed:
  - BETTER_AUTH_SECRET: String must contain at least 32 character(s)
```

**How to fix**:
1. Check root `.env` file exists
2. Ensure `BETTER_AUTH_SECRET` is set and ≥32 chars
3. Verify no typos in variable names

## Troubleshooting

### Backend fails to start

**Error**: "Invalid environment variables. Please check your .env file."

**Solution**:
1. Ensure `.env` exists in root directory
2. Check `BETTER_AUTH_SECRET` is set and ≥32 chars:
   ```bash
   # Generate new secret
   openssl rand -hex 32
   # Add to .env
   echo "BETTER_AUTH_SECRET=$(openssl rand -hex 32)" >> .env
   ```
3. Run from root: `pnpm dev` (not individual app scripts)

### Frontend can't connect to backend

**Symptoms**: API requests fail, CORS errors in console

**Solution**:
1. Verify `VITE_API_URL` matches backend `PORT`:
   ```env
   PORT=3001
   VITE_API_URL=http://localhost:3001
   ```
2. Check `CORS_ORIGINS` includes frontend URL:
   ```env
   CORS_ORIGINS=http://localhost:3000,http://localhost:5173
   ```
3. Restart dev server (Vite caches env vars at startup):
   ```bash
   # Stop and restart
   pnpm dev
   ```

### Docker containers can't communicate

**Symptoms**: Frontend shows "Failed to fetch", backend unreachable

**Solution**:
1. Use Docker internal network in `.env.docker`:
   ```env
   VITE_API_URL=http://backend:3001
   ```
2. Ensure build arg is set in Dockerfile (already configured)
3. Rebuild images:
   ```bash
   docker-compose build --no-cache
   docker-compose up
   ```

### Environment changes not applied

**Turborepo cache**: Changes to `.env` should invalidate cache automatically (configured in `turbo.json`).

**Force cache clear**:
```bash
pnpm turbo clean
pnpm dev
```

**Vite**: Restart dev server (env vars loaded at startup):
```bash
# Ctrl+C to stop, then:
pnpm dev
```

**Docker**: Rebuild images if build-time vars changed:
```bash
docker-compose build
docker-compose up
```

### Secrets accidentally committed to git

**Prevention**: `.gitignore` already excludes `.env` files

**If it happened**:
1. Remove from git history:
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env" \
     --prune-empty --tag-name-filter cat -- --all
   ```
2. Rotate all secrets immediately
3. Force push (⚠️ coordinate with team)

## Security Best Practices

1. **Never commit secrets**
   - Use `.env.example` templates only
   - Real secrets in `.env` (gitignored)

2. **Generate strong secrets**
   ```bash
   # Better Auth (32 bytes)
   openssl rand -hex 32

   # OAuth encryption (32 bytes)
   openssl rand -hex 32

   # License keys (Ed25519)
   openssl genpkey -algorithm ed25519 -out private.pem
   openssl pkey -in private.pem -pubout -out public.pem
   ```

3. **Separate environments**
   - Development: Local `.env`
   - Staging: CI/CD variables
   - Production: Secure vault (AWS Secrets Manager, HashiCorp Vault)

4. **Rotate regularly**
   - Update production secrets every 90 days
   - Rotate immediately if compromised

5. **Use CI/CD secrets**
   - Never hardcode in workflows
   - Use platform secret managers

6. **Principle of least privilege**
   - Only grant access to secrets when needed
   - Use separate API keys per environment

## Advanced Usage

### Multiple Environment Files

Create environment-specific files:
```bash
.env.development
.env.staging
.env.production
```

Load specific file:
```bash
# Development (default)
pnpm dev

# Staging
cp .env.staging .env
pnpm dev

# Production
cp .env.production .env
pnpm start
```

### Environment-specific Turborepo Tasks

Add to `turbo.json`:
```json
{
  "tasks": {
    "dev:staging": {
      "env": ["STAGING_API_URL"]
    }
  }
}
```

### Helper Scripts

Use the setup script to automate initialization:
```bash
pnpm setup
```

This script:
1. Copies `.env.example` to `.env`
2. Generates `BETTER_AUTH_SECRET`
3. Prompts for optional configuration

## References

- [Turborepo Environment Variables](https://turbo.build/repo/docs/handbook/environment-variables)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Docker Compose Environment](https://docs.docker.com/compose/environment-variables/)
- [Better Auth Configuration](https://www.better-auth.com/docs)
- [Resend API Documentation](https://resend.com/docs)

## Support

For issues with environment configuration:
1. Check this guide first
2. Review `.env.example` for correct variable names
3. Run backend with `LOG_LEVEL=debug` for detailed logs
4. Check GitHub issues for similar problems
