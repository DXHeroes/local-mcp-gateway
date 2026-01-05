# Development Setup

Complete guide to setting up a development environment for Local MCP Gateway.

## Prerequisites

### Required Software

| Software | Version | Installation |
|----------|---------|--------------|
| Node.js | 20+ | [nodejs.org](https://nodejs.org/) |
| pnpm | 9+ | `npm install -g pnpm` |
| Git | Latest | [git-scm.com](https://git-scm.com/) |

### Recommended

| Software | Purpose |
|----------|---------|
| VS Code | IDE with TypeScript support |
| Docker | For containerized testing |

---

## Initial Setup

### 1. Clone Repository

```bash
git clone https://github.com/DXHeroes/local-mcp-gateway.git
cd local-mcp-gateway
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Start Development

```bash
pnpm dev
```

This starts:
- Backend on `http://localhost:3001`
- Frontend on `http://localhost:3000`

---

## IDE Setup

### VS Code

#### Recommended Extensions

- **Biome** - Formatting and linting
- **Tailwind CSS IntelliSense** - Tailwind autocomplete
- **TypeScript Vue Plugin (Volar)** - Vue/TypeScript support
- **Prisma** - Database schema support

#### Workspace Settings

The project includes `.vscode/settings.json` with:
- Format on save
- Biome as default formatter
- TypeScript configuration

### Cursor

Same extensions as VS Code. Cursor is fully compatible.

---

## Project Scripts

### Root Scripts

```bash
# Development
pnpm dev                 # Start all in dev mode
pnpm dev:backend         # Start backend only
pnpm dev:frontend        # Start frontend only
pnpm dev:https           # Start with HTTPS tunnel

# Building
pnpm build               # Build all packages
pnpm start               # Start production server

# Testing
pnpm test                # Run all tests
pnpm test:unit           # Run unit tests
pnpm test:integration    # Run integration tests
pnpm test:e2e            # Run E2E tests
pnpm test:coverage       # Run with coverage
pnpm test:watch          # Watch mode

# Quality
pnpm lint                # Run linter
pnpm format              # Format code
pnpm typecheck           # Type check
pnpm check               # Run all checks

# Database
pnpm db:seed             # Seed database
pnpm db:reset            # Reset database

# Docker
pnpm docker:build        # Build Docker images
pnpm docker:up           # Start Docker containers
pnpm docker:down         # Stop Docker containers
```

---

## Environment Configuration

### Development

Create `.env` in root (optional):

```bash
NODE_ENV=development
PORT=3001
LOG_LEVEL=debug
```

### Required for OAuth

```bash
OAUTH_ENCRYPTION_KEY=your-32-character-minimum-secret
```

Generate:
```bash
openssl rand -hex 32
```

---

## Database

### Location

Default: `~/.local-mcp-gateway-data/local-mcp-gateway.db`

### Reset

```bash
pnpm db:reset
```

### Migrations

Migrations run automatically on startup.

### Viewing Data

Use any SQLite browser:
- DB Browser for SQLite
- VS Code SQLite extension
- Command line: `sqlite3`

---

## Testing

### Unit Tests

```bash
pnpm test:unit
```

Located in `__tests__/unit/` directories.

### Integration Tests

```bash
pnpm test:integration
```

Located in `__tests__/integration/` directories.

### E2E Tests

```bash
pnpm test:e2e
```

Uses Playwright. Requires running gateway.

### Coverage

```bash
pnpm test:coverage
```

Reports generated in `coverage/` directory.

---

## Debugging

### Backend Debugging

#### VS Code Launch Config

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Backend",
  "runtimeExecutable": "pnpm",
  "args": ["dev:backend"],
  "console": "integratedTerminal"
}
```

#### Console Logging

Backend logs to console with timestamps and levels.

### Frontend Debugging

Use browser DevTools:
- React DevTools extension
- Network tab for API calls
- Console for errors

### Debug Logs

Open `http://localhost:3000/debug-logs` to see MCP traffic.

---

## Hot Reload

### Backend

Uses `tsx watch` for automatic restart on changes.

### Frontend

Vite provides HMR (Hot Module Replacement).

### Packages

Changes to packages require rebuild:
```bash
pnpm build
```

Or use watch mode in the package.

---

## Common Tasks

### Adding a Package Dependency

```bash
# Add to specific package
pnpm --filter @local-mcp/backend add express

# Add to root (dev dependency)
pnpm add -D -w typescript
```

### Creating a New Package

```bash
pnpm run create-package
```

### Updating Dependencies

```bash
pnpm update
```

---

## Troubleshooting

### `pnpm install` fails

```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### TypeScript errors

```bash
pnpm typecheck
```

Fix reported errors.

### Port in use

```bash
lsof -i :3001
kill -9 <PID>
```

### Build fails

```bash
rm -rf packages/*/dist apps/*/dist
pnpm build
```

---

## See Also

- [Testing Guide](./testing-guide.md) - Testing details
- [Code Style](./code-style.md) - Style conventions
- [Monorepo Structure](../technical/architecture/monorepo-structure.md) - Project layout
