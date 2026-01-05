# Installation Guide

This guide covers detailed installation steps for Local MCP Gateway.

## System Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| Node.js | 20.0.0 | 22.x (LTS) |
| pnpm | 9.0.0 | 10.x |
| RAM | 512 MB | 2 GB |
| Disk Space | 500 MB | 1 GB |

### Supported Operating Systems

- **macOS** 12+ (Monterey or later)
- **Linux** (Ubuntu 20.04+, Debian 11+, Fedora 36+)
- **Windows** 10/11 (with WSL2 recommended)

---

## Installation Methods

### Method 1: From Source (Recommended)

Best for development and customization.

```bash
# 1. Clone the repository
git clone https://github.com/DXHeroes/local-mcp-gateway.git
cd local-mcp-gateway

# 2. Install pnpm if not installed
npm install -g pnpm

# 3. Install dependencies
pnpm install

# 4. Start development server
pnpm dev
```

### Method 2: Docker

Best for isolated deployment.

```bash
# 1. Clone the repository
git clone https://github.com/DXHeroes/local-mcp-gateway.git
cd local-mcp-gateway

# 2. Build and run with Docker Compose
docker-compose up -d
```

Access the UI at `http://localhost:3000`.

---

## Configuration

### Environment Variables

Create a `.env` file in the root directory (optional):

```bash
# Server configuration
NODE_ENV=development
PORT=3001

# Database (default: ~/.local-mcp-gateway-data/local-mcp-gateway.db)
DATABASE_PATH=/custom/path/to/database.db

# CORS (comma-separated origins)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Logging
LOG_LEVEL=info  # error, warn, info, debug

# OAuth encryption (min 32 characters, required for OAuth)
OAUTH_ENCRYPTION_KEY=your-32-character-minimum-secret-key

# Error tracking (optional)
SENTRY_DSN=https://...@sentry.io/...
```

### Database Location

By default, the database is stored at:

| OS | Default Path |
|----|--------------|
| macOS | `~/.local-mcp-gateway-data/local-mcp-gateway.db` |
| Linux | `~/.local-mcp-gateway-data/local-mcp-gateway.db` |
| Windows | `%USERPROFILE%\.local-mcp-gateway-data\local-mcp-gateway.db` |

To use a custom location, set `DATABASE_PATH` environment variable.

---

## Post-Installation

### Verify Installation

1. Open `http://localhost:3000` in your browser
2. You should see the Profiles page
3. Check the health endpoint:
   ```bash
   curl http://localhost:3001/health
   # Expected: {"status":"ok"}
   ```

### Seed Default Data

The database is automatically seeded on first run with:
- A **system profile** for internal operations

To manually reset and reseed:

```bash
pnpm db:reset
```

---

## Development Setup

### IDE Configuration

**VS Code** (recommended):

1. Install extensions:
   - Biome (formatting/linting)
   - Tailwind CSS IntelliSense
   - TypeScript Vue Plugin (Volar)

2. The workspace includes settings in `.vscode/`

**Cursor IDE**:

Same extensions as VS Code. Cursor is fully compatible.

### Running Tests

```bash
# Run all tests
pnpm test

# Run unit tests only
pnpm test:unit

# Run integration tests
pnpm test:integration

# Run with coverage
pnpm test:coverage

# Watch mode
pnpm test:watch
```

### Building for Production

```bash
# Build all packages
pnpm build

# Start production server
pnpm start
```

---

## Updating

To update to the latest version:

```bash
# Pull latest changes
git pull origin main

# Install any new dependencies
pnpm install

# Rebuild
pnpm build

# Restart the server
pnpm dev
```

Database migrations run automatically on startup.

---

## Uninstallation

### Remove Application

```bash
# From the project directory
cd ..
rm -rf local-mcp-gateway
```

### Remove Data

```bash
# Remove database and configuration
rm -rf ~/.local-mcp-gateway-data
```

### Docker Cleanup

```bash
# Stop and remove containers
docker-compose down

# Remove images
docker rmi local-mcp-gateway-backend local-mcp-gateway-frontend
```

---

## Next Steps

- [Quick Start](./quick-start.md) - Get running in 5 minutes
- [Your First Profile](./first-profile.md) - Create a profile
- [Adding MCP Servers](./first-mcp-server.md) - Add your first server

---

## Troubleshooting Installation

### `pnpm: command not found`

Install pnpm globally:

```bash
npm install -g pnpm
```

Or use corepack (Node.js 16.10+):

```bash
corepack enable
corepack prepare pnpm@latest --activate
```

### `node: command not found`

Install Node.js from [nodejs.org](https://nodejs.org/) or use a version manager:

```bash
# Using nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 22
nvm use 22
```

### Permission Errors

On Linux/macOS, you may need to fix npm permissions:

```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### Build Failures

Clear caches and reinstall:

```bash
# Remove node_modules and build artifacts
rm -rf node_modules packages/*/node_modules apps/*/node_modules
rm -rf packages/*/dist apps/*/dist

# Clear pnpm cache
pnpm store prune

# Reinstall
pnpm install
```

See [Troubleshooting Guide](../../reference/troubleshooting.md) for more solutions.
