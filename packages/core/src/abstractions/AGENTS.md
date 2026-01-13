# Core Abstractions

## Purpose

Abstract base classes for MCP server implementations. All MCP servers in `mcp-servers/` must extend the `McpServer` base class.

## Parent Reference

- **[../AGENTS.md](../AGENTS.md)** - Core package source instructions
- **[../../AGENTS.md](../../AGENTS.md)** - Core package instructions
- **[../../../AGENTS.md](../../../AGENTS.md)** - Packages directory instructions
- **[../../../../AGENTS.md](../../../../AGENTS.md)** - Root directory instructions

## Files

- `McpServer.ts` - Abstract base class
  - All MCP servers in `mcp-servers/` must extend this
  - Methods: `initialize()`, `listTools()`, `callTool()`, `listResources()`, `readResource()`
  - Strong typing with generics

## Usage

```typescript
import { McpServer } from '@dxheroes/local-mcp-core';
import type { ApiKeyConfig, McpTool, McpResource } from '@dxheroes/local-mcp-core';

export class MyMcpServer extends McpServer {
  constructor(private apiKeyConfig: ApiKeyConfig | null) {
    super();
  }

  async initialize(): Promise<void> { /* ... */ }
  async listTools(): Promise<McpTool[]> { /* ... */ }
  async callTool(name: string, args: unknown): Promise<unknown> { /* ... */ }
  async listResources(): Promise<McpResource[]> { return []; }
  async readResource(uri: string): Promise<unknown> { throw new Error('Not implemented'); }
}
```

## Related

- **[../../../../mcp-servers/AGENTS.md](../../../../mcp-servers/AGENTS.md)** - How to create MCP packages
- **[../types/mcp-package.ts](../types/mcp-package.ts)** - McpPackage interface

## Development Rules

- All classes must be abstract or have clear interfaces
- JSDoc comments required for all public methods
- TDD: Write tests before implementation
- Follow SOLID principles

