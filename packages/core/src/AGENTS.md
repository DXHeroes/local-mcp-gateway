# Core Package Source

## Purpose

Source code for core abstractions and types used throughout the MCP gateway.

## Parent Reference

- **[../AGENTS.md](../AGENTS.md)** - Core package instructions
- **[../../AGENTS.md](../../AGENTS.md)** - Packages directory instructions
- **[../../../AGENTS.md](../../../AGENTS.md)** - Root directory instructions

## Structure

```
src/
├── types/
│   ├── mcp.ts              # MCP protocol types
│   ├── mcp-package.ts      # McpPackage interface for mcp-servers/
│   ├── profile.ts          # Profile types
│   └── index.ts            # Type exports
├── abstractions/
│   ├── McpServer.ts        # Abstract base class
│   └── index.ts            # Abstraction exports
└── index.ts                # Package exports
```

## Directories

### Types (`types/`)
- `mcp.ts` - MCP protocol types, tool/resource definitions, API key config
- `mcp-package.ts` - `McpPackage` interface for creating MCP server packages
- `profile.ts` - Profile types, server configuration types

### Abstractions (`abstractions/`)
- `McpServer.ts` - Abstract base class for MCP servers

### Entry Point
- `index.ts` - Exports all public APIs

## Child Directories

- **[types/AGENTS.md](types/AGENTS.md)** - Type definitions
- **[abstractions/AGENTS.md](abstractions/AGENTS.md)** - Abstract classes

## Development Rules

- All files must have JSDoc comments
- Strong typing with TypeScript
- Export all public APIs from `index.ts`
