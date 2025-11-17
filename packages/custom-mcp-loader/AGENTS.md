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

- `src/ModuleLoader.ts` - Loads TypeScript modules from `custom-mcps/` directory with TypeScript compilation
- `src/Validator.ts` - Validates custom MCP structure using zod schemas (strict validation before loading)

## Dependencies

- `@local-mcp/core` - For McpServer base class
- `zod` - Validation schemas (strict validation before loading)
- `chokidar` - File watching for hot-reload
- `tsx` or TypeScript compiler API - TypeScript compilation before loading
- `vm2` or worker threads - Sandboxing for security

## Development Rules

- **Strict validation** - Validate all modules with zod schemas before loading
- **TypeScript compilation** - Compile TypeScript modules before execution
- **Sandboxing** - VM2 or worker threads for security isolation
- **Hot-reload** - File watching with chokidar in dev mode (with re-validation)
- **Path traversal prevention** - Block `../` patterns
- **Syntax validation** - Validate syntax before execution
- **Resource limits** - CPU, memory, execution time limits
- **File type validation** - Only allow .ts and .js files
- **File size limits** - Prevent loading of oversized files

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

