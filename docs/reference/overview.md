# API reference

## Base URL

- Development: `http://localhost:3001`
- Docker: `http://localhost:9631`

## Authentication

Most API endpoints require an authenticated session. The gateway supports two authentication methods:

- **Session cookie**: Set automatically after login via `/api/auth/...` endpoints (managed by Better Auth).
- **Bearer token**: Pass `Authorization: Bearer <token>` header for programmatic access.

Public endpoints (health checks, MCP proxy) do not require authentication.

## Auth endpoints

Authentication is handled by [Better Auth](https://www.better-auth.com/) at the `/api/auth/` prefix. Key routes include:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/sign-up/email` | Register with email and password |
| POST | `/api/auth/sign-in/email` | Sign in with email and password |
| POST | `/api/auth/sign-in/social` | Sign in with Google OAuth |
| GET | `/api/auth/get-session` | Get current session |
| POST | `/api/auth/sign-out` | Sign out |

> **Note**: Better Auth provides additional endpoints for session management, password reset, and more. See the [Better Auth documentation](https://www.better-auth.com/docs) for full details.

### Organization endpoints (Better Auth plugin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/organization/create` | Create a new organization |
| GET | `/api/auth/organization/list` | List user's organizations |
| POST | `/api/auth/organization/set-active` | Switch active organization |
| POST | `/api/auth/organization/invite-member` | Invite a member by email |
| POST | `/api/auth/organization/accept-invitation` | Accept an invitation |
| POST | `/api/auth/organization/update-member-role` | Change a member's role |
| POST | `/api/auth/organization/remove-member` | Remove a member |

## Profiles

All profile endpoints require authentication. Resources are scoped to the user's active organization.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profiles` | List all profiles |
| POST | `/api/profiles` | Create a new profile |
| GET | `/api/profiles/:id` | Get profile by ID |
| GET | `/api/profiles/by-name/:name` | Get profile by name |
| PUT | `/api/profiles/:id` | Update profile |
| DELETE | `/api/profiles/:id` | Delete profile |
| GET | `/api/profiles/:id/servers` | List servers in a profile |
| POST | `/api/profiles/:id/servers` | Add a server to a profile |
| PUT | `/api/profiles/:id/servers/:serverId` | Update server in a profile |
| DELETE | `/api/profiles/:id/servers/:serverId` | Remove server from a profile |
| PUT | `/api/profiles/:id/servers/:serverId/toggle` | Toggle server active status |
| GET | `/api/profiles/:id/servers/:serverId/tools` | Get tools (use `?refresh=true` to refresh) |
| PUT | `/api/profiles/:id/servers/:serverId/tools` | Update tool customizations |

## MCP servers

All endpoints require authentication. Resources are scoped to the user's active organization.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/mcp-servers` | List all MCP servers |
| POST | `/api/mcp-servers` | Create a new MCP server |
| GET | `/api/mcp-servers/:id` | Get MCP server by ID |
| PUT | `/api/mcp-servers/:id` | Update MCP server |
| DELETE | `/api/mcp-servers/:id` | Delete MCP server |
| GET | `/api/mcp-servers/:id/tools` | Get tools from an MCP server |
| GET | `/api/mcp-servers/:id/status` | Get MCP server connection status |
| GET | `/api/mcp-servers/batch-status` | Get status for all servers (parallel) |
| GET | `/api/mcp-servers/presets` | List available presets (built-in + external) |
| POST | `/api/mcp-servers/presets/:presetId/add` | Add a preset to user's servers |

## Sharing

All endpoints require authentication.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sharing` | Share a resource with a user or organization |
| GET | `/api/sharing/summary/:resourceType` | Get sharing summary for `profile` or `mcp_server` |
| GET | `/api/sharing/:resourceType/:resourceId` | List shares for a specific resource |
| DELETE | `/api/sharing/:id` | Remove a share |

**Request body for `POST /api/sharing`:**
```json
{
  "resourceType": "profile" | "mcp_server",
  "resourceId": "uuid",
  "sharedWithType": "user" | "organization",
  "sharedWithId": "uuid",
  "permission": "admin" | "use"
}
```

## Organization domains

Manage auto-join email domains for organizations. All endpoints require authentication.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/organization-domains` | List domains for the active organization |
| POST | `/api/organization-domains` | Add an auto-join domain |
| DELETE | `/api/organization-domains/:id` | Remove a domain |

## MCP proxy endpoints (public)

MCP proxy endpoints are public but protected by the McpOAuthGuard (validates Bearer tokens or session cookies).

### Gateway

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/mcp/gateway` | Gateway info (supports SSE with `Accept: text/event-stream`) |
| POST | `/api/mcp/gateway` | MCP JSON-RPC requests |
| GET | `/api/mcp/gateway/sse` | SSE stream for real-time notifications |
| POST | `/api/mcp/gateway/sse` | JSON-RPC requests via SSE endpoint |
| GET | `/api/mcp/gateway/info` | Gateway info with available tools |

### Org-scoped gateway

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/mcp/:orgSlug/gateway` | Org-scoped gateway info |
| POST | `/api/mcp/:orgSlug/gateway` | Org-scoped MCP JSON-RPC requests |
| GET | `/api/mcp/:orgSlug/gateway/sse` | Org-scoped SSE stream |
| POST | `/api/mcp/:orgSlug/gateway/sse` | Org-scoped JSON-RPC via SSE |
| GET | `/api/mcp/:orgSlug/gateway/info` | Org-scoped gateway info |

### Org-scoped profiles

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/mcp/:orgSlug/:profileName` | Profile info |
| POST | `/api/mcp/:orgSlug/:profileName` | MCP JSON-RPC requests for a profile |
| GET | `/api/mcp/:orgSlug/:profileName/sse` | SSE stream for a profile |
| POST | `/api/mcp/:orgSlug/:profileName/sse` | JSON-RPC via SSE for a profile |
| GET | `/api/mcp/:orgSlug/:profileName/info` | Profile info with available tools |

## Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/settings` | Get all settings |
| GET | `/api/settings/default-gateway-profile` | Get default gateway profile |
| PUT | `/api/settings/default-gateway-profile` | Set default gateway profile |

## OAuth (for MCP servers)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/oauth/authorize/:mcpServerId` | Initiate OAuth flow for an MCP server |
| GET | `/api/oauth/callback` | OAuth callback handler |

## Debug logs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/debug/logs` | Get debug logs (supports filters: `profileId`, `mcpServerId`, `status`, `since`, `until`, `limit`, `offset`) |
| DELETE | `/api/debug/logs` | Clear debug logs (optional filters: `profileId`, `mcpServerId`) |

## Health (public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Liveness probe |
| GET | `/health/ready` | Readiness probe (checks database) |
| GET | `/health/auth-config` | Auth configuration for frontend feature detection |

## Response format

All API responses follow standard HTTP status codes. JSON responses use the following format:

```json
{
  "id": "uuid",
  "name": "string",
  ...
}
```

Error responses:

```json
{
  "error": "Error message",
  "details": {}
}
```

## Rate limiting

- General API: 100 requests per 15 minutes per IP
- MCP Gateway: 60 requests per minute per IP
