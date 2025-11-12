# Frontend E2E Tests

## Purpose

End-to-end tests using Playwright for complete user flows.

## Parent Reference

- **[../AGENTS.md](../AGENTS.md)** - Frontend application instructions
- **[../../AGENTS.md](../../AGENTS.md)** - Apps directory instructions
- **[../../../AGENTS.md](../../../AGENTS.md)** - Root directory instructions

## Files

- `profiles.spec.ts` - Profile management E2E tests
  - Create profile flow
  - Edit profile flow
  - Delete profile flow
  - MCP endpoint URL display and copy
- `mcp-servers.spec.ts` - MCP server management E2E tests
  - Add remote MCP server (HTTP/SSE)
  - OAuth flow (Linear setup)
  - API key setup
  - Delete MCP server
- `oauth-flow.spec.ts` - OAuth flow E2E tests
  - OAuth consent screen redirect
  - Callback handling
  - Token refresh
  - Token revocation
- `custom-mcp.spec.ts` - Custom MCP E2E tests
  - Create custom MCP
  - Edit custom MCP
  - Use custom MCP in profile

## Development Rules

- Tests must be deterministic
- Use page object model pattern
- Test complete user flows
- Include error scenarios
- Screenshots on failure
- Retry mechanism for flaky tests

## Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Profiles', () => {
  test('should create profile and display MCP endpoint', async ({ page }) => {
    // Test implementation
  });
});
```

## Related Documentation

- [../../../docs/development/testing.md](../../../docs/development/testing.md) - Testing guide

