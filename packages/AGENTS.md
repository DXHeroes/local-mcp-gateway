# Packages Directory

## Purpose

This directory contains shared packages used across the monorepo. These packages provide core abstractions, database layer, and custom MCP loading functionality.

## Structure

```
packages/
├── core/                    # Core abstractions and types
├── database/                # SQLite database layer
└── custom-mcp-loader/       # Dynamic loader for custom MCPs
```

## Parent Reference

- **[../AGENTS.md](../AGENTS.md)** - Root directory instructions

## Child Directories

- **[core/AGENTS.md](core/AGENTS.md)** - Core abstractions package
- **[database/AGENTS.md](database/AGENTS.md)** - Database layer package
- **[custom-mcp-loader/AGENTS.md](custom-mcp-loader/AGENTS.md)** - Custom MCP loader package

## Package Dependencies

Packages can depend on each other using workspace protocol:
- `@local-mcp/core` - Core abstractions
- `@local-mcp/database` - Database layer
- `@local-mcp/custom-mcp-loader` - Custom MCP loader

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

