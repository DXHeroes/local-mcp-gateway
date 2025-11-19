# Backend Handlers

## Purpose

Business logic handlers for processing requests and generating responses.

## Parent Reference

- **[../AGENTS.md](../AGENTS.md)** - Backend source instructions
- **[../../AGENTS.md](../../AGENTS.md)** - Backend application instructions
- **[../../../AGENTS.md](../../../AGENTS.md)** - Apps directory instructions
- **[../../../../AGENTS.md](../../../../AGENTS.md)** - Root directory instructions

## Files

- `McpProxyHandler.ts` - MCP proxy request handling
  - Aggregates tools/resources from all MCP servers in profile
  - Routes requests to appropriate MCP server
  - Handles HTTP and SSE transports
  - Merge strategies for duplicate tool names
  - Error handling and fallback
- `ProfileHandler.ts` - Profile management business logic
  - Profile CRUD operations
  - Validation
  - MCP endpoint URL generation
- `OAuthHandler.ts` - OAuth 2.1 flow handling
  - Initiates OAuth flow
  - Processes OAuth callback
  - Token refresh logic
  - Token revocation

## Development Rules

- Handlers should be thin - delegate to managers/repositories
- All handlers must have error handling
- JSDoc comments for all public methods
- TDD: Write tests before implementation
- Use dependency injection for testability

## Dependencies

- `@dxheroes/local-mcp-core` - ProfileManager, OAuthManager, ApiKeyManager, ProxyHandler
- `@dxheroes/local-mcp-database` - Repositories

