# Frontend Pages

## Purpose

Main page components for the application.

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
  - OAuth setup flow with consent screen handling
  - API key setup form
  - Linear MCP quick setup (pre-filled)
  - List all MCP servers with status
- `CustomMcp.tsx` - Custom MCP creation page
  - Code editor (Monaco or similar) with TypeScript syntax highlighting
  - Hot-reload preview
  - Validation feedback
  - Save/load custom MCP
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

