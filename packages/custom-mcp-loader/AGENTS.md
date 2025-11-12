# Custom MCP Loader Package

## Purpose

This package provides dynamic loading and validation of custom MCP servers from the `custom-mcps/` directory. It supports both simple implementations and publishable packages.

## Parent Reference

- **[../AGENTS.md](../AGENTS.md)** - Packages directory instructions
- **[../../AGENTS.md](../../AGENTS.md)** - Root directory instructions

## Structure

```
custom-mcp-loader/
├── src/
│   ├── ModuleLoader.ts         # Dynamic module loading
│   ├── Validator.ts             # Structure validation with zod
│   └── index.ts
├── __tests__/
│   ├── unit/                    # Unit tests
│   └── integration/             # Integration tests
├── package.json
└── tsconfig.json
```

## Key Files

- `src/ModuleLoader.ts` - Loads TypeScript modules from `custom-mcps/` directory
- `src/Validator.ts` - Validates custom MCP structure using zod schemas

## Dependencies

- `@local-mcp/core` - For McpServer base class
- `zod` - Validation schemas
- `chokidar` - File watching for hot-reload

## Development Rules

- Validate all modules before loading
- Sandboxing for security (VM2 or worker threads)
- Hot-reload support in dev mode
- Path traversal prevention
- Syntax validation before execution
- Resource limits (CPU, memory, execution time)

## Security Requirements

- **Sandboxing**: VM2 or isolated worker threads
- **Resource limits**: CPU, memory, execution time
- **Network restrictions**: Limited or no network access
- **File system restrictions**: Only allowed paths
- **No eval()**: Never use eval() or Function() constructor
- **Whitelist imports**: Only allow specific imports

## Testing Requirements

- Unit tests for loader and validator
- Integration tests with real custom MCP modules
- Security tests (sandboxing, resource limits)
- Hot-reload tests
- Coverage: ≥90%

## Usage Example

```typescript
import { CustomMcpLoader } from '@local-mcp/custom-mcp-loader';

const loader = new CustomMcpLoader();
const mcpServer = await loader.load('custom-mcps/my-mcp');
```

## Related Documentation

- [../../docs/guides/custom-mcp.md](../../docs/guides/custom-mcp.md) - User guide
- [../../docs/examples/simple-mcp.md](../../docs/examples/simple-mcp.md) - Example

