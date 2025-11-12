# Core Package

## Purpose

This package contains core abstractions, types, and base classes for the MCP proxy server. It provides the foundation for all MCP server implementations (external, custom, remote).

## Parent Reference

- **[../AGENTS.md](../AGENTS.md)** - Packages directory instructions
- **[../../AGENTS.md](../../AGENTS.md)** - Root directory instructions

## Structure

```
core/
├── src/
│   ├── types/
│   │   ├── mcp.ts              # MCP types and interfaces
│   │   ├── profile.ts           # Profile types
│   │   └── database.ts         # Database types
│   ├── abstractions/
│   │   ├── McpServer.ts         # Abstract base class for MCP servers
│   │   ├── ProxyHandler.ts      # Proxy logic and aggregation
│   │   ├── ProfileManager.ts    # Profile management
│   │   ├── OAuthManager.ts      # OAuth 2.1 flow management
│   │   └── ApiKeyManager.ts    # API key management
│   └── index.ts                 # Package exports
├── __tests__/
│   ├── unit/                    # Unit tests
│   └── integration/             # Integration tests
├── package.json
└── tsconfig.json
```

## Key Files

### Types
- `src/types/mcp.ts` - MCP protocol types, tool definitions, resource definitions
- `src/types/profile.ts` - Profile types, MCP server configuration types
- `src/types/database.ts` - Database entity types

### Abstractions
- `src/abstractions/McpServer.ts` - Abstract base class that all MCP servers must extend
- `src/abstractions/ProxyHandler.ts` - Handles routing and aggregation of MCP requests
- `src/abstractions/ProfileManager.ts` - Profile CRUD operations and validation
- `src/abstractions/OAuthManager.ts` - OAuth 2.1 implementation according to MCP standard
- `src/abstractions/ApiKeyManager.ts` - Secure API key storage and header injection

## Dependencies

- `@local-mcp/database` - For database types and repositories
- `zod` - Runtime validation
- `@modelcontextprotocol/sdk` - MCP SDK types

## Development Rules

- All classes must be abstract or have clear interfaces
- Strong typing with TypeScript generics
- All public methods must have JSDoc comments
- Follow SOLID principles
- TDD: Write tests before implementation

## Testing Requirements

- Unit tests for all abstractions
- Mock dependencies (database, external services)
- Test error handling and edge cases
- Coverage: ≥90%

## Usage Example

```typescript
import { McpServer } from '@local-mcp/core';

class MyMcpServer extends McpServer {
  async initialize() {
    // Implementation
  }
  
  async listTools() {
    // Return tools
  }
}
```

