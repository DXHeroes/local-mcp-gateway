# Core Types

## Purpose

Type definitions for MCP protocol, profiles, and database entities.

## Parent Reference

- **[../AGENTS.md](../AGENTS.md)** - Core package source instructions
- **[../../AGENTS.md](../../AGENTS.md)** - Core package instructions
- **[../../../AGENTS.md](../../../AGENTS.md)** - Packages directory instructions
- **[../../../../AGENTS.md](../../../../AGENTS.md)** - Root directory instructions

## Files

- `mcp.ts` - MCP protocol types
  - Tool definitions
  - Resource definitions
  - JSON-RPC 2.0 types
  - MCP server interface types
- `profile.ts` - Profile and MCP server configuration types
  - Profile type
  - MCP server configuration types (external, custom, remote_http, remote_sse)
  - OAuth configuration types
  - API key configuration types
- `database.ts` - Database entity types
  - Re-exports from @local-mcp/database for convenience
  - Profile entity
  - MCP server entity
  - OAuth token entity
  - Debug log entity

## Development Rules

- Use zod for runtime validation
- All types must be exported
- Document complex types with JSDoc

