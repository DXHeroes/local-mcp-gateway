# Core Abstractions

## Purpose

Abstract base classes and managers for MCP proxy functionality.

## Parent Reference

- **[../AGENTS.md](../AGENTS.md)** - Core package source instructions
- **[../../AGENTS.md](../../AGENTS.md)** - Core package instructions
- **[../../../AGENTS.md](../../../AGENTS.md)** - Packages directory instructions
- **[../../../../AGENTS.md](../../../../AGENTS.md)** - Root directory instructions

## Files

- `McpServer.ts` - Abstract base class
  - All MCP servers (external, custom, remote) must extend this
  - Methods: initialize(), listTools(), callTool(), listResources(), readResource()
  - Strong typing with generics
- `ProxyHandler.ts` - Proxy logic
  - Aggregates requests across MCP servers in a profile
  - Merge strategies for tools/resources
  - Error handling and retry logic
- `ProfileManager.ts` - Profile management
  - CRUD operations
  - Validation
  - URL generation for profiles
- `OAuthManager.ts` - OAuth 2.1 management
  - Dynamic Client Registration (RFC 7591)
  - PKCE generation and validation
  - Resource Indicators (RFC 8707)
  - Protected Resource Metadata discovery (RFC 9728)
  - Authorization Server Metadata discovery (RFC 8414)
  - Token management and refresh
- `ApiKeyManager.ts` - API key management
  - Secure storage (encrypted)
  - Header injection
  - Template support for header values

## Development Rules

- All classes must be abstract or have clear interfaces
- JSDoc comments required for all public methods
- TDD: Write tests before implementation
- Follow SOLID principles

