# Migration Guide: Centralized Environment Configuration

## What Changed?

The environment configuration has been centralized from app-specific `.env` files to a single root `.env` file loaded by Turborepo.

**Before:**
- Individual `.env` files in `apps/backend/` and `apps/frontend/`
- Each app loaded its own configuration

**After:**
- Single root `.env` file in project root
- Turborepo loads and injects variables into all apps via `globalDotEnv`
- Backend Zod validation unchanged
- Frontend Vite env handling unchanged

## Migration Steps

### For Existing Developers

If you have an existing `apps/backend/.env` file:

1. **Backup your current configuration:**
   ```bash
   cp apps/backend/.env ~/backup-env
   ```

2. **Copy the root template:**
   ```bash
   cp .env.example .env
   ```

3. **Transfer your values:**
   ```bash
   # View your current values
   cat ~/backup-env

   # Edit root .env and copy relevant values
   nano .env  # or your preferred editor
   ```

4. **Add frontend variable:**
   ```env
   # Add this to root .env (must match PORT)
   VITE_API_URL=http://localhost:3001
   ```

5. **Remove old env files (optional):**
   ```bash
   # Keep as backup or delete
   rm apps/backend/.env
   ```

6. **Test:**
   ```bash
   pnpm dev
   ```

### For New Developers

Simply follow the Quick Start in the main [Environment Setup Guide](./ENVIRONMENT_SETUP.md):

```bash
cp .env.example .env
# Generate BETTER_AUTH_SECRET: openssl rand -hex 32
# Edit .env with your values
pnpm dev
```

## What Stays the Same

### Backend Code

**No changes required** - Backend continues to:
- Use `process.env` directly
- Validate with Zod schema in `apps/backend/src/lib/env.ts`
- Function exactly as before

The only difference is that `process.env` is now populated by Turborepo instead of dotenv.

### Frontend Code

**No changes required** - Frontend continues to:
- Use Vite's native env handling
- Access variables via `import.meta.env.VITE_*`
- Read env at build time

### Scripts

All package.json scripts work the same:
```bash
pnpm dev           # Works as before
pnpm dev:https     # Works as before
pnpm build         # Works as before
```

## CI/CD Changes

### GitHub Actions

**No breaking changes** - Environment variables work the same way:

```yaml
# .github/workflows/deploy.yml
env:
  BETTER_AUTH_SECRET: ${{ secrets.BETTER_AUTH_SECRET }}
  RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
  # ... other secrets
```

Turborepo will automatically load these from the environment.

### GitLab CI

**No breaking changes** - Same as before:

```yaml
# .gitlab-ci.yml
variables:
  NODE_ENV: production
  PORT: "3001"

deploy:
  script:
    - pnpm install
    - pnpm build
  variables:
    BETTER_AUTH_SECRET: $BETTER_AUTH_SECRET
```

### Other CI Platforms

Environment variables continue to work the same way. Turborepo reads from `process.env` just like dotenv did.

## Docker Deployment Changes

### Before

```yaml
# docker-compose.yml
services:
  backend:
    environment:
      - NODE_ENV=production
      - PORT=3001
      - BETTER_AUTH_SECRET=...
  frontend:
    environment:
      - VITE_API_URL=http://backend:3001
```

### After

```yaml
# docker-compose.yml
services:
  backend:
    env_file:
      - .env.docker
    environment:
      - NODE_ENV=production  # Can still override

  frontend:
    build:
      args:
        - VITE_API_URL=${VITE_API_URL:-http://backend:3001}
```

**New file: `.env.docker`**
```env
NODE_ENV=production
PORT=3001
DATABASE_PATH=/app/data/local-mcp-gateway.db
VITE_API_URL=http://backend:3001
```

**Why the change?**
- Centralized Docker configuration
- Easier to manage environment-specific settings
- Consistent with local development approach

## Breaking Changes

### ⚠️ Frontend package.json

**Before:**
```json
"dev:https": "VITE_API_URL=https://localhost:3002 vite"
```

**After:**
```json
"dev:https": "vite --mode https"
```

**Impact**: If you run `pnpm dev:https` in frontend app directly, it now reads from `apps/frontend/.env.https`.

**Fix**: Either:
1. Use from root: `pnpm --filter frontend dev:https` (recommended)
2. Create `apps/frontend/.env.https` with your URL

### No Other Breaking Changes

All other code, scripts, and configurations remain unchanged.

## Rollback Plan

If you encounter issues and need to rollback:

1. **Keep your backup:**
   ```bash
   # You saved this earlier
   cp ~/backup-env apps/backend/.env
   ```

2. **Revert git changes:**
   ```bash
   git checkout HEAD -- turbo.json
   git checkout HEAD -- apps/frontend/package.json
   git checkout HEAD -- docker-compose.yml
   git checkout HEAD -- apps/frontend/Dockerfile
   ```

3. **Remove root .env files:**
   ```bash
   rm .env .env.example .env.docker
   ```

4. **Continue with app-specific .env:**
   - Backend reads from `apps/backend/.env` (if using dotenv - currently doesn't)
   - Frontend reads from Vite's default locations

Note: Backend currently doesn't use dotenv, so you may need to add it for rollback to work.

## Common Migration Issues

### Issue 1: "BETTER_AUTH_SECRET is required"

**Cause**: Root `.env` missing or `BETTER_AUTH_SECRET` not set

**Fix:**
```bash
# Generate and add to .env
echo "BETTER_AUTH_SECRET=$(openssl rand -hex 32)" >> .env
```

### Issue 2: Frontend can't reach backend

**Cause**: `VITE_API_URL` not matching backend `PORT`

**Fix:**
```bash
# Ensure these match in .env
PORT=3001
VITE_API_URL=http://localhost:3001
```

### Issue 3: Docker build fails

**Cause**: `VITE_API_URL` not passed as build arg

**Fix:**
1. Ensure `.env.docker` has `VITE_API_URL`
2. docker-compose.yml has `args` section (already configured)
3. Rebuild:
   ```bash
   docker-compose build --no-cache
   ```

### Issue 4: Changes to .env not taking effect

**Cause**: Turborepo cache or Vite cache

**Fix:**
```bash
# Clear Turbo cache
pnpm turbo clean

# Restart dev server
pnpm dev
```

## Benefits of New Approach

### Single Source of Truth

- One `.env` file for all configuration
- Easier to see all environment variables
- No confusion about which app needs which vars

### Better DX (Developer Experience)

- Centralized documentation in `.env.example`
- Consistent setup across team
- Faster onboarding for new developers

### Easier Testing

- Test environments easier to configure
- CI/CD simpler (same vars for all apps)
- Docker configuration cleaner

### Future-Proof

- Scales better as monorepo grows
- Easier to add new apps/packages
- Turborepo natively supports this pattern

## Questions?

- **Full documentation**: [Environment Setup Guide](./ENVIRONMENT_SETUP.md)
- **Troubleshooting**: See [Environment Setup - Troubleshooting](./ENVIRONMENT_SETUP.md#troubleshooting)
- **GitHub Issues**: Report migration problems as issues

## Timeline

This migration was implemented in:
- **Preparation**: Environment analysis and planning
- **Implementation**: Centralized .env configuration with Turborepo
- **Testing**: Local dev, Docker, and CI/CD scenarios
- **Documentation**: Complete guides for setup and migration

No functionality changes - only configuration structure.
