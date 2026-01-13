# Database Seeds

## Purpose

Prisma seed data for initializing the database with default profiles and example data.

**NOTE:** MCP servers are auto-seeded from their packages in `mcp-servers/`. Each MCP package defines its own seed configuration.

## Parent Reference

- **[../AGENTS.md](../AGENTS.md)** - Database package source instructions
- **[../../AGENTS.md](../../AGENTS.md)** - Database package instructions
- **[../../../AGENTS.md](../../../AGENTS.md)** - Packages directory instructions
- **[../../../../AGENTS.md](../../../../AGENTS.md)** - Root directory instructions

## Files

- `seed.ts` - Main Prisma seed script
  - Creates "default" profile
  - Runs via `pnpm prisma:seed`
  - Idempotent (uses upsert)

## How MCP Seeding Works

1. Database seed creates base profiles
2. Backend starts and discovers MCP packages from `mcp-servers/`
3. `McpSeedService` runs seed config from each MCP package
4. MCP servers are automatically linked to profiles based on `seed.defaultProfile`

## Commands

```bash
# Run Prisma seed
pnpm prisma:seed

# Reset and reseed database
pnpm prisma:migrate:reset
```

## Development Rules

- Seeds should be idempotent (use Prisma `upsert`)
- MCP-specific seeds belong in MCP packages, not here
- Document seed data in comments

