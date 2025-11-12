# Custom MCPs Directory

## Purpose

This directory contains user-created custom MCP server implementations. These are simple TypeScript modules that extend the `McpServer` base class. No package creation required for basic implementations.

## Parent Reference

- **[../AGENTS.md](../AGENTS.md)** - Root directory instructions

## Structure

```
custom-mcps/
├── example-mcp/                # Example custom MCP
│   ├── index.ts                 # Main implementation
│   ├── tools/
│   │   └── weather.ts           # Tool implementations
│   ├── resources/
│   │   └── config.ts             # Resource implementations
│   └── package.json              # Optional, only if publishing
└── [user-created-mcps]/         # User's custom MCPs
```

## Development Rules

- Each MCP is a directory with `index.ts` as entry point
- Must extend `McpServer` from `@local-mcp/core`
- Hot-reload supported in dev mode
- No need for package.json unless publishing
- Follow best practices from documentation

## Simple Implementation Example

```typescript
// custom-mcps/my-mcp/index.ts
import { McpServer } from '@local-mcp/core';
import { z } from 'zod';

export default class MyMcpServer extends McpServer {
  async initialize() {
    // Initialization logic
  }

  async listTools() {
    return [{
      name: 'my_tool',
      description: 'Tool description',
      inputSchema: z.object({ ... })
    }];
  }

  async callTool(name: string, args: unknown) {
    // Business logic + API calls
  }
}
```

## Publishing as Package

If you want to publish your MCP as a package:
1. Create package in `packages/mcp-<name>/`
2. See: [../packages/AGENTS.md](../packages/AGENTS.md)

## Related Documentation

- [../docs/guides/custom-mcp.md](../docs/guides/custom-mcp.md) - User guide
- [../docs/examples/simple-mcp.md](../docs/examples/simple-mcp.md) - Examples
- [../packages/core/AGENTS.md](../packages/core/AGENTS.md) - Core abstractions

