# Frontend Pages

## Purpose

Main page components for the application.

**NOTE:** No user authentication required - all features are immediately accessible.

## Parent Reference

- **[../AGENTS.md](../AGENTS.md)** - Frontend source instructions
- **[../../AGENTS.md](../../AGENTS.md)** - Frontend application instructions
- **[../../../AGENTS.md](../../../AGENTS.md)** - Apps directory instructions
- **[../../../../AGENTS.md](../../../../AGENTS.md)** - Root directory instructions

## Files

- `Profiles.tsx` - Profile management page
  - Displays list of profiles
  - Create/edit profile form
  - MCP endpoint URL display with copy button
  - Transport type indicator (HTTP/SSE)
  - Delete profile functionality
- `McpServers.tsx` - MCP server management page
  - Add remote MCP server form (HTTP/SSE)
  - Configure builtin MCP servers (auto-discovered from mcp-servers/)
  - OAuth setup flow with consent screen handling
  - API key setup form
  - List all MCP servers with status
- `DebugLogs.tsx` - Debug logs viewer page
  - Filter by profile, MCP server, request type, status
  - JSON viewer for request/response payloads
  - Real-time updates (WebSocket or polling)
  - Export logs functionality

## Development Rules

- Use React Query for data fetching
- Error boundaries for error handling
- Loading states for async operations
- Optimistic updates where appropriate
- TDD: Write tests before implementation

## Related Components

- [../components/ProfileCard.tsx](../components/ProfileCard.tsx)
- [../components/McpServerCard.tsx](../components/McpServerCard.tsx)
- [../components/OAuthFlowHandler.tsx](../components/OAuthFlowHandler.tsx)

