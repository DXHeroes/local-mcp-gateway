# Custom MCP Loader Source

## Purpose

Source code for dynamically loading and validating custom MCP servers.

## Parent Reference

- **[../AGENTS.md](../AGENTS.md)** - Custom MCP loader package instructions
- **[../../AGENTS.md](../../AGENTS.md)** - Packages directory instructions
- **[../../../AGENTS.md](../../../AGENTS.md)** - Root directory instructions

## Files

- `ModuleLoader.ts` - Dynamic module loading
  - Loads TypeScript modules from custom-mcps/ directory
  - Supports hot-reload in dev mode (chokidar)
  - Sandboxing for security (VM2 or worker threads)
  - Resource limits (CPU, memory, execution time)
- `Validator.ts` - Structure validation
  - Validates custom MCP structure using zod schemas
  - Syntax validation before execution
  - Path traversal prevention
  - File type and size validation
- `index.ts` - Package exports

## Development Rules

- Validate all modules before loading
- Security is critical: sandboxing, resource limits
- Hot-reload support in dev mode
- Clear error messages for validation failures

## Security Requirements

- Sandboxing (VM2 or worker threads)
- Resource limits
- Network restrictions
- File system restrictions
- No eval() or Function() constructor

