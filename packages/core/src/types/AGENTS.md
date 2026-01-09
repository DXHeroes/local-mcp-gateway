# Core Types

## Purpose

Type definitions for MCP protocol, profiles, MCP packages, and configuration.

## Parent Reference

- **[../AGENTS.md](../AGENTS.md)** - Core package source instructions
- **[../../AGENTS.md](../../AGENTS.md)** - Core package instructions
- **[../../../AGENTS.md](../../../AGENTS.md)** - Packages directory instructions
- **[../../../../AGENTS.md](../../../../AGENTS.md)** - Root directory instructions

## Files

### `mcp.ts` - MCP Protocol Types
- Tool definitions (`McpTool`)
- Resource definitions (`McpResource`)
- JSON-RPC 2.0 types
- API key configuration (`ApiKeyConfig`)

### `mcp-package.ts` - MCP Package Types
- `McpPackage` interface - Required for MCP server packages
- `McpPackageMetadata` - Package metadata (id, name, description, etc.)
- `McpSeedConfig` - Auto-seeding configuration
- `McpServerFactory` - Factory function type
- `DiscoveredMcpPackage` - Discovery result type

### `profile.ts` - Profile Types
- Profile type definitions
- MCP server configuration types (builtin, external, custom, remote_http, remote_sse)
- OAuth configuration types

## McpPackage Interface

The key interface for MCP server packages:

```typescript
interface McpPackage {
  metadata: {
    id: string;              // Unique ID (kebab-case)
    name: string;            // Display name
    description: string;
    version: string;
    requiresApiKey: boolean;
    apiKeyHint?: string;
    apiKeyDefaults?: {
      headerName: string;
      headerValueTemplate: string;
    };
    tags?: string[];
    icon?: string;
  };

  createServer: (apiKeyConfig: ApiKeyConfig | null) => McpServer;

  seed?: {
    defaultProfile?: string | null;
    defaultOrder?: number;
    defaultActive?: boolean;
  };
}
```

## Development Rules

- Use Zod for runtime validation
- All types must be exported from `index.ts`
- Document complex types with JSDoc

## Related

- **[../../../../mcp-servers/AGENTS.md](../../../../mcp-servers/AGENTS.md)** - How to create MCP packages
- **[../abstractions/AGENTS.md](../abstractions/AGENTS.md)** - McpServer base class
