# Core Package

## Purpose

Core abstractions, types, and base classes for the MCP proxy server. Provides the foundation for all MCP server implementations and the `McpPackage` interface for creating new MCP server packages.

## Parent Reference

- **[../AGENTS.md](../AGENTS.md)** - Packages directory instructions
- **[../../AGENTS.md](../../AGENTS.md)** - Root directory instructions

## Structure

```
core/
├── src/
│   ├── types/
│   │   ├── mcp.ts              # MCP protocol types
│   │   ├── mcp-package.ts      # McpPackage interface for server packages
│   │   ├── profile.ts          # Profile types
│   │   └── index.ts            # Type exports
│   ├── abstractions/
│   │   ├── McpServer.ts        # Abstract base class for MCP servers
│   │   └── index.ts            # Abstraction exports
│   └── index.ts                # Package exports
├── __tests__/
├── package.json
└── tsconfig.json
```

## Key Exports

### Types (`src/types/`)

- **`mcp.ts`** - MCP protocol types
  - `McpTool` - Tool definition
  - `McpResource` - Resource definition
  - `ApiKeyConfig` - API key configuration
  - JSON-RPC types

- **`mcp-package.ts`** - MCP package types (for `mcp-servers/` packages)
  - `McpPackage` - Main interface for MCP server packages
  - `McpPackageMetadata` - Package metadata
  - `McpSeedConfig` - Auto-seeding configuration
  - `McpServerFactory` - Server factory function type
  - `DiscoveredMcpPackage` - Discovery result

- **`profile.ts`** - Profile and configuration types

### Abstractions (`src/abstractions/`)

- **`McpServer.ts`** - Abstract base class that all MCP servers must extend
  - `initialize()` - Initialize server (async)
  - `listTools()` - Return available tools
  - `callTool()` - Execute a tool
  - `listResources()` - Return available resources
  - `readResource()` - Read a resource

## Usage Examples

### Creating an MCP Server

```typescript
import { McpServer } from '@dxheroes/local-mcp-core';
import type { ApiKeyConfig, McpTool } from '@dxheroes/local-mcp-core';

export class MyMcpServer extends McpServer {
  constructor(private apiKeyConfig: ApiKeyConfig | null) {
    super();
  }

  async initialize(): Promise<void> {
    // Initialize your server
  }

  async listTools(): Promise<McpTool[]> {
    return [
      { name: 'my_tool', description: 'My tool', inputSchema: {...} }
    ];
  }

  async callTool(name: string, args: unknown): Promise<unknown> {
    // Handle tool calls
  }
}
```

### Creating an MCP Package

```typescript
import type { McpPackage, ApiKeyConfig } from '@dxheroes/local-mcp-core';
import { MyMcpServer } from './server.js';

export const mcpPackage: McpPackage = {
  metadata: {
    id: 'my-package',
    name: 'My Package',
    description: 'Description',
    version: '1.0.0',
    requiresApiKey: true,
  },
  createServer: (apiKeyConfig: ApiKeyConfig | null) => {
    return new MyMcpServer(apiKeyConfig);
  },
  seed: {
    defaultProfile: 'default',
  },
};
```

## Dependencies

- `zod` - Runtime validation
- `@modelcontextprotocol/sdk` - MCP SDK

## Child Directories

- **[src/AGENTS.md](src/AGENTS.md)** - Source code documentation

## Related

- **[../../mcp-servers/AGENTS.md](../../mcp-servers/AGENTS.md)** - MCP server packages
