# Contributing to Local MCP Gateway

Thank you for your interest in contributing to Local MCP Gateway! This document provides guidelines and information for contributors.

## Getting Started

### Prerequisites

- **Node.js**: >=22.0.0 (check `.nvmrc` for exact version)
- **pnpm**: >=9.0.0 (specified in `packageManager` field)

### Development Setup

```bash
# Clone the repository
git clone https://github.com/DXHeroes/local-mcp-gateway.git
cd local-mcp-gateway

# Install dependencies
pnpm install

# Initialize database
pnpm db:seed

# Start development
pnpm dev
```

This starts:
- **Backend**: http://localhost:3001 (NestJS)
- **Frontend**: http://localhost:3000 (React 19 + Vite)

## Project Structure

This is a **pnpm workspace + Turborepo** monorepo:

```
local-mcp-gateway/
├── apps/
│   ├── backend/      # NestJS 11.x backend
│   └── frontend/     # React 19 + Vite frontend
├── packages/
│   ├── core/         # Core types and abstractions
│   ├── database/     # Prisma ORM + SQLite
│   ├── config/       # Shared configuration
│   └── ui/           # Shared UI components
├── mcp-servers/      # MCP server packages (auto-discovered)
└── docs/             # Documentation
```

## Development Workflow

### Code Style

We use **Biome** for linting and formatting:

```bash
# Lint code
pnpm lint

# Format code
pnpm format

# Check formatting without changes
pnpm format:check
```

**Style Rules:**
- Single quotes for strings
- Semicolons required
- 2-space indentation
- 100 character line width

### Type Checking

```bash
pnpm typecheck
```

### Testing

```bash
# Run all tests
pnpm test

# Unit tests
pnpm test:unit

# Integration tests
pnpm test:integration

# E2E tests
pnpm test:e2e

# Coverage report
pnpm test:coverage
```

### Full Check

Before submitting a PR, run:

```bash
pnpm check
```

This runs lint, typecheck, tests, and build.

## Making Changes

### Branches

- `main` - Production-ready code
- Feature branches - `feature/your-feature-name`
- Bug fixes - `fix/bug-description`

### Commit Messages

We follow conventional commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Test additions/changes
- `chore:` - Maintenance tasks

### Pull Requests

1. Fork the repository
2. Create a feature branch from `main`
3. Make your changes
4. Run `pnpm check` to ensure everything passes
5. Submit a pull request

**PR Guidelines:**
- Keep PRs focused and small
- Include tests for new functionality
- Update documentation if needed
- Link related issues

## Creating MCP Server Packages

To create a new MCP server in `mcp-servers/`:

```bash
pnpm create-custom-mcp
```

Or manually:

1. Create folder in `mcp-servers/your-mcp-name/`
2. Add `package.json` with `"mcpPackage": true`
3. Export `McpPackage` interface from `src/index.ts`
4. Run `pnpm install`

See `mcp-servers/gemini-deep-research/` for reference.

## Database Changes

When modifying the Prisma schema:

```bash
cd packages/database

# Create migration
pnpm prisma:migrate:dev --name your_migration_name

# Generate client
pnpm prisma generate
```

## Questions?

- Open an issue for bugs or feature requests
- Check existing issues before creating new ones
- See [AGENTS.md](./AGENTS.md) for detailed technical documentation

## License

By contributing, you agree that your contributions will be licensed under the [Elastic License 2.0](./LICENSE).
