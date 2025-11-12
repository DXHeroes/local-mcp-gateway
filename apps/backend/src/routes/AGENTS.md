# Backend Routes

## Purpose

Express route definitions for all API endpoints.

## Parent Reference

- **[../AGENTS.md](../AGENTS.md)** - Backend source instructions
- **[../../AGENTS.md](../../AGENTS.md)** - Backend application instructions
- **[../../../AGENTS.md](../../../AGENTS.md)** - Apps directory instructions
- **[../../../../AGENTS.md](../../../../AGENTS.md)** - Root directory instructions

## Files

- `profiles.ts` - Profile management routes
  - GET /api/profiles - List all profiles
  - POST /api/profiles - Create profile
  - GET /api/profiles/:id - Get profile
  - PUT /api/profiles/:id - Update profile
  - DELETE /api/profiles/:id - Delete profile
- `mcp-servers.ts` - MCP server management routes
  - GET /api/mcp-servers - List all MCP servers
  - POST /api/mcp-servers - Create MCP server
  - GET /api/mcp-servers/:id - Get MCP server
  - PUT /api/mcp-servers/:id - Update MCP server
  - DELETE /api/mcp-servers/:id - Delete MCP server
  - POST /api/mcp-servers/:id/api-key - Set API key
- `debug.ts` - Debug logs routes
  - GET /api/debug/logs - Get debug logs (with filtering)
- `proxy.ts` - MCP proxy endpoints per profile
  - POST /api/mcp/:profileId - HTTP MCP endpoint (JSON-RPC 2.0)
  - GET /api/mcp/:profileId/sse - SSE MCP endpoint (Server-Sent Events)
  - GET /api/mcp/:profileId/info - Metadata endpoint (tools, resources)
- `oauth.ts` - OAuth 2.1 routes
  - GET /api/oauth/authorize/:mcpServerId - Initiate OAuth flow
  - GET /api/oauth/callback - OAuth callback handler
  - POST /api/oauth/refresh/:mcpServerId - Refresh access token
  - GET /api/oauth/status/:mcpServerId - Get OAuth status
  - DELETE /api/oauth/revoke/:mcpServerId - Revoke tokens

## Development Rules

- All routes must use validation middleware
- All routes must use error handler middleware
- Rate limiting applied to all routes
- Security headers applied to all routes
- JSDoc comments for route handlers
- Request/response types defined with zod

## Related Documentation

- [../../../../docs/api/overview.md](../../../../docs/api/overview.md) - API documentation

