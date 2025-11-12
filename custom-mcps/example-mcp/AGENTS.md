# Example Custom MCP

## Purpose

Example implementation of a custom MCP server to demonstrate the structure and best practices.

## Parent Reference

- **[../AGENTS.md](../AGENTS.md)** - Custom MCPs directory instructions
- **[../../AGENTS.md](../../AGENTS.md)** - Root directory instructions

## Structure

```
example-mcp/
├── index.ts            # Main implementation
├── tools/
│   └── weather.ts      # Tool implementations
├── resources/
│   └── config.ts       # Resource implementations
└── package.json        # Optional, only if publishing
```

## Files

- `index.ts` - Main MCP server implementation
  - Extends McpServer from @local-mcp/core
  - Implements initialize(), listTools(), callTool(), listResources(), readResource()
- `tools/weather.ts` - Example tool implementation
  - Weather API integration example
  - Shows how to structure tools
- `resources/config.ts` - Example resource implementation
  - Shows how to structure resources
- `package.json` - Optional, only needed if publishing as package

## Development Rules

- Follow the structure shown in this example
- Use zod for input validation
- Document all tools and resources
- Handle errors gracefully
- See documentation for best practices

## Related Documentation

- [../../docs/guides/custom-mcp.md](../../docs/guides/custom-mcp.md) - User guide
- [../../docs/examples/simple-mcp.md](../../docs/examples/simple-mcp.md) - Examples
- [../../packages/core/AGENTS.md](../../packages/core/AGENTS.md) - Core abstractions

