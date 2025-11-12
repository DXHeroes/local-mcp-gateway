# Database Repositories

## Purpose

Repository pattern implementation for all database operations. Provides type-safe, secure database access.

## Parent Reference

- **[../AGENTS.md](../AGENTS.md)** - Database package source instructions
- **[../../AGENTS.md](../../AGENTS.md)** - Database package instructions
- **[../../../AGENTS.md](../../../AGENTS.md)** - Packages directory instructions
- **[../../../../AGENTS.md](../../../../AGENTS.md)** - Root directory instructions

## Files

- `ProfileRepository.ts` - Profile operations
  - create(), findById(), findAll(), update(), delete()
  - Validation with zod before database operations
  - Prepared statements for all queries
- `McpServerRepository.ts` - MCP server operations
  - create(), findById(), findAll(), update(), delete()
  - Query by type (external, custom, remote_http, remote_sse)
  - OAuth and API key config management
- `DebugLogRepository.ts` - Debug logs operations
  - create(), findById(), findByProfile(), findByMcpServer()
  - Filtering by status, request type, date range
  - Pagination support
- `OAuthTokenRepository.ts` - OAuth token operations
  - store(), findByMcpServer(), refresh(), revoke()
  - Encrypted storage
  - Token expiration handling
- `OAuthClientRegistrationRepository.ts` - OAuth client registrations
  - register(), findByMcpServer(), update()
  - Dynamic Client Registration support

## Development Rules

- **CRITICAL**: Always use prepared statements
- Never use string concatenation for SQL
- Input validation with zod before database operations
- Use transactions for multi-step operations
- Handle errors gracefully
- JSDoc comments for all public methods

## Security Requirements

- SQL injection prevention (prepared statements)
- Input sanitization
- Encrypted storage for sensitive data
- Secure file permissions for database file

