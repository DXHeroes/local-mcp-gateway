# Packages Directory

## Purpose

This directory contains shared packages used across the monorepo. These packages provide core abstractions, database layer, and custom MCP loading functionality.

## Structure

```
packages/
├── config/                  # Shared TypeScript, Vitest, and Vite configuration
├── core/                    # Core abstractions and types
├── database/                # SQLite database layer (Drizzle ORM)
├── custom-mcp-loader/      # Dynamic loader for custom MCPs
└── ui/                      # Shared UI components (shadcn-ui) with Tailwind CSS v4
```

## Parent Reference

- **[../AGENTS.md](../AGENTS.md)** - Root directory instructions

## Child Directories

- **[config/AGENTS.md](config/AGENTS.md)** - Shared configuration package
- **[core/AGENTS.md](core/AGENTS.md)** - Core abstractions package
- **[database/AGENTS.md](database/AGENTS.md)** - Database layer package
- **[custom-mcp-loader/AGENTS.md](custom-mcp-loader/AGENTS.md)** - Custom MCP loader package

## Package Dependencies

Packages can depend on each other using workspace protocol:
- `@local-mcp/config` - Shared configuration (TypeScript, Vitest, Vite)
- `@local-mcp/core` - Core abstractions (McpServer, ProxyHandler, OAuthManager, etc.)
- `@local-mcp/database` - Database layer (Drizzle ORM with SQLite)
- `@local-mcp/custom-mcp-loader` - Custom MCP loader (TypeScript compilation, hot-reload, sandboxing)
- `@local-mcp/ui` - Shared UI components (shadcn-ui based) with Tailwind CSS v4 configuration

## Development Rules

- Each package must have its own `package.json`
- Packages must be built before apps can use them
- TypeScript strict mode is required
- All public APIs must have JSDoc comments
- Tests must be written before implementation (TDD)

## Testing

- Unit tests in `__tests__/unit/`
- Integration tests in `__tests__/integration/`
- Coverage requirement: ≥90%

