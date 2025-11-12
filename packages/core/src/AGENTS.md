# Core Package Source

## Purpose

Source code for core abstractions and types.

## Parent Reference

- **[../AGENTS.md](../AGENTS.md)** - Core package instructions
- **[../../AGENTS.md](../../AGENTS.md)** - Packages directory instructions
- **[../../../AGENTS.md](../../../AGENTS.md)** - Root directory instructions

## Structure

```
src/
├── types/
│   ├── mcp.ts              # MCP types and interfaces
│   ├── profile.ts           # Profile types
│   └── database.ts          # Database types
├── abstractions/
│   ├── McpServer.ts         # Abstract base class for MCP servers
│   ├── ProxyHandler.ts      # Proxy logic and aggregation
│   ├── ProfileManager.ts    # Profile management
│   ├── OAuthManager.ts      # OAuth 2.1 flow management
│   └── ApiKeyManager.ts     # API key management
└── index.ts                 # Package exports
```

## Files

### Types (`types/`)
- `mcp.ts` - MCP protocol types, tool definitions, resource definitions, JSON-RPC types
- `profile.ts` - Profile types, MCP server configuration types, profile-MCP relationships
- `database.ts` - Database entity types (re-exported from @local-mcp/database for convenience)

### Abstractions (`abstractions/`)
- `McpServer.ts` - Abstract base class that all MCP servers must extend
- `ProxyHandler.ts` - Handles routing and aggregation of MCP requests across servers
- `ProfileManager.ts` - Profile CRUD operations, validation, URL generation
- `OAuthManager.ts` - OAuth 2.1 implementation (DCR, PKCE, Resource Indicators, etc.)
- `ApiKeyManager.ts` - Secure API key storage, header injection, template support

### Entry Point
- `index.ts` - Exports all public APIs from this package

## Development Rules

- All files must have JSDoc comments
- TDD: Write tests before implementation
- Strong typing with TypeScript generics
- Follow SOLID principles

