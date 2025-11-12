# API Documentation

## Purpose

Complete API reference for all REST endpoints and MCP proxy endpoints.

## Parent Reference

- **[../AGENTS.md](../AGENTS.md)** - Documentation directory instructions
- **[../../AGENTS.md](../../AGENTS.md)** - Root directory instructions

## Files

- `overview.md` - API overview, authentication, base URL
- `profiles.md` - Profile management API (CRUD operations)
- `mcp-servers.md` - MCP server management API
- `oauth.md` - OAuth endpoints (authorization flow, callback, token management)
- `proxy-endpoints.md` - MCP proxy endpoints per profile
  - HTTP endpoint: `/api/mcp/:profileId`
  - SSE endpoint: `/api/mcp/:profileId/sse`
  - Usage in AI tools (Cursor, Claude)
- `debug-logs.md` - Debug logs API

## Documentation Requirements

- Auto-generated from TypeDoc comments
- Request/response examples for each endpoint
- Error handling documentation
- Rate limiting information
- OpenAPI/Swagger specification (optional)

## Related Code

- [../../apps/backend/src/routes/](../../apps/backend/src/routes/) - Route implementations
- [../../apps/backend/src/handlers/](../../apps/backend/src/handlers/) - Request handlers

## Target Audience

Developers integrating with the API or using MCP proxy endpoints.

