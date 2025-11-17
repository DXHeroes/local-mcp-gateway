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

### MCP Proxy

- `POST /api/mcp/:profileId` - HTTP MCP endpoint (JSON-RPC 2.0)
- `GET /api/mcp/:profileId/sse` - SSE MCP endpoint (Server-Sent Events)
- `GET /api/mcp/:profileId/info` - Metadata endpoint (tools, resources)

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
- MCP Proxy: 60 requests per minute per IP

