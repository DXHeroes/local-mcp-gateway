# API Overview

## Base URL

- Development: `http://localhost:3001`
- Production: Configure via `API_URL` environment variable

## Authentication

Currently, the API does not require authentication as it runs locally. All endpoints are accessible without authentication tokens.

## Endpoints

### Profiles

- `GET /api/profiles` - List all profiles
- `POST /api/profiles` - Create a new profile
- `GET /api/profiles/:id` - Get profile by ID
- `PUT /api/profiles/:id` - Update profile
- `DELETE /api/profiles/:id` - Delete profile

### MCP Servers

- `GET /api/mcp-servers` - List all MCP servers
- `POST /api/mcp-servers` - Create a new MCP server
- `GET /api/mcp-servers/:id` - Get MCP server by ID
- `PUT /api/mcp-servers/:id` - Update MCP server
- `DELETE /api/mcp-servers/:id` - Delete MCP server
- `POST /api/mcp-servers/:id/api-key` - Set API key for MCP server

### MCP Profile Endpoints

- `POST /api/mcp/:profileSlug` - HTTP MCP endpoint (JSON-RPC 2.0)
- `GET /api/mcp/:profileSlug/sse` - SSE MCP endpoint (Server-Sent Events)
- `GET /api/mcp/:profileSlug/info` - Metadata endpoint (tools, resources)

### Gateway Endpoint

The unified gateway endpoint aggregates tools from the default profile.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/mcp/gateway` | Gateway info (supports SSE with `Accept: text/event-stream`) |
| POST | `/api/mcp/gateway` | MCP JSON-RPC requests |
| GET | `/api/mcp/gateway/sse` | SSE stream for real-time notifications |
| GET | `/api/mcp/gateway/info` | Gateway info with available tools |

### Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/settings` | Get all settings |
| GET | `/api/settings/default-gateway-profile` | Get default gateway profile |
| PUT | `/api/settings/default-gateway-profile` | Set default gateway profile |

### Tool Customization

Tools can be customized per-profile, allowing you to enable/disable specific tools, rename them, or customize their descriptions.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profiles/:id/servers/:serverId/tools` | Get tools (use `?refresh=true` to refresh from server) |
| PUT | `/api/profiles/:id/servers/:serverId/tools` | Update tool customizations |

### OAuth

- `GET /api/oauth/authorize/:mcpServerId` - Initiate OAuth flow
- `GET /api/oauth/callback` - OAuth callback handler

### Health

- `GET /health` - Health check endpoint

## Response Format

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

## Rate Limiting

- General API: 100 requests per 15 minutes per IP
- MCP Gateway: 60 requests per minute per IP

