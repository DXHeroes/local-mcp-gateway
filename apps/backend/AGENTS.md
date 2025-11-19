# Backend Application

## Purpose

Express.js backend that serves as the MCP proxy server. Handles profile management, MCP server management, OAuth flows, API key management, and MCP proxy endpoints per profile.

## Parent Reference

- **[../AGENTS.md](../AGENTS.md)** - Apps directory instructions
- **[../../AGENTS.md](../../AGENTS.md)** - Root directory instructions

## Structure

```
backend/
├── src/
│   ├── server.ts              # Express server setup
│   ├── routes/
│   │   ├── profiles.ts        # Profile management routes
│   │   ├── mcp-servers.ts    # MCP server management routes
│   │   ├── debug.ts           # Debug logs routes
│   │   ├── proxy.ts           # MCP proxy endpoints
│   │   └── oauth.ts           # OAuth 2.1 routes
│   ├── handlers/
│   │   ├── McpProxyHandler.ts
│   │   ├── ProfileHandler.ts
│   │   └── OAuthHandler.ts
│   ├── middleware/
│   │   ├── debug-logger.ts
│   │   ├── error-handler.ts
│   │   ├── validation.ts      # Request validation
│   │   ├── rate-limit.ts      # Rate limiting
│   │   ├── security-headers.ts # Security headers
│   │   ├── oauth-injector.ts  # OAuth token injection
│   │   └── api-key-injector.ts # API key injection
│   └── index.ts
├── __tests__/
│   ├── unit/                  # Unit tests
│   ├── integration/           # Integration tests (Supertest)
│   └── fixtures/              # Test fixtures
├── Dockerfile                 # Multi-stage Docker build
├── package.json
└── tsconfig.json
```

## Key Endpoints

### MCP Proxy Endpoints (per profile)
- `POST /api/mcp/:profileId` - HTTP MCP endpoint
- `GET /api/mcp/:profileId/sse` - SSE MCP endpoint
- `GET /api/mcp/:profileId/info` - Metadata endpoint

### Management Endpoints
- `GET/POST/PUT/DELETE /api/profiles` - Profile management
- `GET/POST/PUT/DELETE /api/mcp-servers` - MCP server management
- `GET /api/debug/logs` - Debug logs

### OAuth Endpoints
- `GET /api/oauth/authorize/:mcpServerId` - Initiate OAuth flow
- `GET /api/oauth/callback` - OAuth callback
- `POST /api/oauth/refresh/:mcpServerId` - Refresh token
- `GET /api/oauth/status/:mcpServerId` - OAuth status
- `DELETE /api/oauth/revoke/:mcpServerId` - Revoke tokens

### API Key Endpoints
- `POST /api/mcp-servers/:id/api-key` - Set API key

## Dependencies

- `express` - Web framework
- `@dxheroes/local-mcp-core` - Core abstractions (McpServer, ProxyHandler, OAuthManager, ApiKeyManager)
- `@dxheroes/local-mcp-database` - Database layer (Drizzle ORM with SQLite)
- `@dxheroes/local-mcp-custom-mcp-loader` - Custom MCP loader
- `@modelcontextprotocol/sdk` - MCP SDK
- `zod` - Validation
- `winston` - Logging
- `oauth4webapi` or `openid-client` - OAuth 2.1
- `drizzle-orm` - Database ORM (DB-agnostic)
- `better-sqlite3` - SQLite driver
- `localtunnel` - HTTPS tunneling for development

## Development Rules

- **TDD**: Write tests before implementation
- **Hot-reload**: Use `tsx watch` or `nodemon`
- **Security**: All inputs validated, rate limiting, security headers
- **Error handling**: Consistent error responses
- **Logging**: Structured logging with winston
- **Documentation**: JSDoc for all public functions

## Security Middleware Stack

1. Request validation (zod)
2. Rate limiting
3. CORS
4. Security headers
5. Input sanitization
6. OAuth/API key injection
7. Error handling

## Testing Requirements

- Unit tests for handlers and middleware
- Integration tests for all API endpoints (Supertest)
- E2E tests for MCP proxy endpoints
- Security tests (input validation, SQL injection, XSS)
- Coverage: ≥90%

## Environment Variables

- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `DATABASE_PATH` - SQLite database path
- `OAUTH_ENCRYPTION_KEY` - Key for encrypting OAuth tokens

## Related Documentation

- [../../docs/api/overview.md](../../docs/api/overview.md) - API documentation
- [../../docs/architecture/mcp-proxy.md](../../docs/architecture/mcp-proxy.md) - Architecture

