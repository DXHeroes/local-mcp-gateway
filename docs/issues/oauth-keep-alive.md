# Add keep-alive mechanism for OAuth MCP server sessions

**Labels**: `enhancement`, `oauth`, `reliability`

## Summary

Some OAuth-authenticated MCP servers (e.g., Fellow) disconnect after token expiration. Add a keep-alive mechanism to prevent disconnection and automatically refresh authentication.

## Background

OAuth tokens have limited lifetimes. When a token expires, the MCP server connection is lost, requiring manual reconnection. This disrupts workflows and is particularly problematic for long-running sessions.

## Requirements

- Add "Keep Alive" checkbox/toggle in MCP server configuration UI
- Implement periodic health check/ping for enabled servers
- Automatically refresh OAuth tokens before expiration
- Handle reconnection gracefully on unexpected disconnect
- Show connection status indicator in UI

## Technical Considerations

- Monitor OAuth token `expires_at` timestamp
- Implement proactive token refresh (e.g., 5 minutes before expiry)
- Add WebSocket/SSE keepalive for streaming connections
- Log keep-alive events and token refreshes in debug logs (Traces)
- Consider exponential backoff for reconnection attempts

## Acceptance Criteria

- [ ] MCP server config UI has "Keep Alive" toggle
- [ ] OAuth tokens are refreshed automatically before expiration
- [ ] Connection is maintained across token refreshes
- [ ] Disconnections are handled with automatic reconnection
- [ ] Keep-alive events visible in Traces
