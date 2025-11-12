# Backend Source

## Purpose

Express.js backend source code: routes, handlers, middleware.

## Parent Reference

- **[../AGENTS.md](../AGENTS.md)** - Backend application instructions
- **[../../AGENTS.md](../../AGENTS.md)** - Apps directory instructions
- **[../../../AGENTS.md](../../../AGENTS.md)** - Root directory instructions

## Structure

```
src/
├── server.ts              # Express server setup
├── routes/
│   ├── profiles.ts        # Profile management routes
│   ├── mcp-servers.ts    # MCP server management routes
│   ├── debug.ts           # Debug logs routes
│   ├── proxy.ts           # MCP proxy endpoints
│   └── oauth.ts           # OAuth 2.1 routes
├── handlers/
│   ├── McpProxyHandler.ts
│   ├── ProfileHandler.ts
│   └── OAuthHandler.ts
├── middleware/
│   ├── debug-logger.ts
│   ├── error-handler.ts
│   ├── validation.ts      # Request validation
│   ├── rate-limit.ts      # Rate limiting
│   ├── security-headers.ts # Security headers
│   ├── oauth-injector.ts  # OAuth token injection
│   └── api-key-injector.ts # API key injection
└── index.ts
```

## Files

### Server Setup
- `server.ts` - Express server initialization, middleware setup, route registration
- `index.ts` - Application entry point

### Routes (`routes/`)
- `profiles.ts` - Profile CRUD endpoints (GET, POST, PUT, DELETE /api/profiles)
- `mcp-servers.ts` - MCP server management endpoints
- `debug.ts` - Debug logs endpoints (GET /api/debug/logs with filtering)
- `proxy.ts` - MCP proxy endpoints per profile
  - POST /api/mcp/:profileId - HTTP MCP endpoint
  - GET /api/mcp/:profileId/sse - SSE MCP endpoint
  - GET /api/mcp/:profileId/info - Metadata endpoint
- `oauth.ts` - OAuth 2.1 endpoints
  - GET /api/oauth/authorize/:mcpServerId
  - GET /api/oauth/callback
  - POST /api/oauth/refresh/:mcpServerId
  - GET /api/oauth/status/:mcpServerId
  - DELETE /api/oauth/revoke/:mcpServerId

### Handlers (`handlers/`)
- `McpProxyHandler.ts` - MCP proxy request handling, aggregation, routing
- `ProfileHandler.ts` - Profile management business logic
- `OAuthHandler.ts` - OAuth flow handling, callback processing

### Middleware (`middleware/`)
- `validation.ts` - Request validation with zod schemas
- `rate-limit.ts` - Rate limiting per endpoint
- `security-headers.ts` - Security headers (CSP, HSTS, etc.)
- `oauth-injector.ts` - Automatic OAuth token injection into MCP requests
- `api-key-injector.ts` - Automatic API key injection into MCP requests
- `debug-logger.ts` - Logging all MCP requests (sanitized)
- `error-handler.ts` - Consistent error responses

## Development Rules

- TDD: Write tests before implementation
- All routes must have validation middleware
- Security middleware stack applied to all routes
- JSDoc comments for all public functions
- Error handling must be consistent

