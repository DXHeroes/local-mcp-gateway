# Backend Middleware

## Purpose

Express middleware for request processing, validation, security, and logging.

## Parent Reference

- **[../AGENTS.md](../AGENTS.md)** - Backend source instructions
- **[../../AGENTS.md](../../AGENTS.md)** - Backend application instructions
- **[../../../AGENTS.md](../../../AGENTS.md)** - Apps directory instructions
- **[../../../../AGENTS.md](../../../../AGENTS.md)** - Root directory instructions

## Files

- `validation.ts` - Request validation middleware
  - Validates request body, query params, path params with zod
  - Returns 400 if validation fails
- `rate-limit.ts` - Rate limiting middleware
  - Per-endpoint rate limits
  - Uses express-rate-limit
  - Different limits for different endpoint types
- `security-headers.ts` - Security headers middleware
  - Sets all security headers (CSP, HSTS, X-Frame-Options, etc.)
- `oauth-injector.ts` - OAuth token injection middleware
  - Automatically adds Bearer token to MCP requests
  - Handles token refresh if expired
- `api-key-injector.ts` - API key injection middleware
  - Automatically adds API key to headers according to configuration
  - Template support for header values
- `debug-logger.ts` - Debug logging middleware
  - Logs all MCP requests and responses
  - Sanitizes sensitive data (tokens, API keys)
  - Stores in database for UI display
- `error-handler.ts` - Error handling middleware
  - Consistent error response format
  - No stack traces in production
  - Generic error messages for users

## Development Rules

- Middleware should be composable
- Error handling middleware must be last
- Security middleware should be early in chain
- All middleware must have tests
- JSDoc comments for all middleware functions

## Middleware Order

1. Security headers
2. CORS
3. Rate limiting
4. Request validation
5. Input sanitization
6. OAuth/API key injection
7. Debug logging
8. Error handling (last)

