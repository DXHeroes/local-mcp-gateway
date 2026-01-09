# Packages Directory

## Purpose

Shared packages used across the monorepo. These packages provide core abstractions, database layer, configuration, and UI components.

## Structure

```
packages/
├── config/                  # Shared TypeScript, Vitest, and Vite configuration
├── core/                    # Core abstractions and types (McpServer, McpPackage)
├── database/                # SQLite database layer (Prisma ORM)
└── ui/                      # Shared UI components (shadcn-ui) with Tailwind CSS v4
```

## Parent Reference

- **[../AGENTS.md](../AGENTS.md)** - Root directory instructions

## Related Directories

- **[../mcp-servers/AGENTS.md](../mcp-servers/AGENTS.md)** - MCP server packages (auto-discovered)

## Child Directories

- **[config/AGENTS.md](config/AGENTS.md)** - Shared configuration package
- **[core/AGENTS.md](core/AGENTS.md)** - Core abstractions package
- **[database/AGENTS.md](database/AGENTS.md)** - Database layer package (Prisma)
- **[ui/AGENTS.md](ui/AGENTS.md)** - Shared UI components package

## Package Dependencies

Packages are imported using workspace protocol:
- `@dxheroes/local-mcp-config` - Shared configuration (TypeScript, Vitest, Vite)
- `@dxheroes/local-mcp-core` - Core abstractions (McpServer, McpPackage interfaces)
- `@dxheroes/local-mcp-database` - Database layer (Prisma ORM with SQLite)
- `@dxheroes/local-mcp-ui` - Shared UI components (shadcn-ui based)

## Development Rules

- Each package must have its own `package.json`
- Packages must be built before apps can use them
- TypeScript strict mode is required
- All public APIs must have JSDoc comments

## Testing

- Unit tests in `__tests__/unit/`
- Integration tests in `__tests__/integration/`
- Run with `pnpm test`
