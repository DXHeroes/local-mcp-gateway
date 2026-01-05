# API Documentation

Complete API reference for Local MCP Gateway.

## Overview

Local MCP Gateway exposes a RESTful API for management and a JSON-RPC API for MCP protocol communication.

---

## API Types

| API | Base Path | Purpose |
|-----|-----------|---------|
| REST API | `/api/*` | Management operations |
| MCP Proxy | `/mcp/:slug` | MCP protocol proxy |
| OAuth | `/api/oauth/*` | OAuth flows |
| Debug | `/debug/*` | Debugging tools |

---

## Documentation Index

### REST API

| Document | Description |
|----------|-------------|
| [REST API Overview](./rest-api.md) | Complete endpoint index |
| [Profiles API](./profiles-api.md) | Profile management |
| [MCP Servers API](./mcp-servers-api.md) | Server management |
| [OAuth API](./oauth-api.md) | OAuth operations |

### Proxy & Protocol

| Document | Description |
|----------|-------------|
| [Proxy API](./proxy-api.md) | MCP proxy endpoints |
| [JSON-RPC Protocol](./json-rpc-protocol.md) | MCP protocol details |

### Debug

| Document | Description |
|----------|-------------|
| [Debug API](./debug-api.md) | Debugging endpoints |

---

## Quick Reference

### Profiles

```http
GET    /api/profiles           # List all profiles
POST   /api/profiles           # Create profile
GET    /api/profiles/:id       # Get profile
PUT    /api/profiles/:id       # Update profile
DELETE /api/profiles/:id       # Delete profile
```

### MCP Servers

```http
GET    /api/mcp-servers        # List all servers
POST   /api/mcp-servers        # Create server
GET    /api/mcp-servers/:id    # Get server
PUT    /api/mcp-servers/:id    # Update server
DELETE /api/mcp-servers/:id    # Delete server
```

### Profile-Server Relationships

```http
POST   /api/profiles/:id/servers/:serverId    # Add server to profile
DELETE /api/profiles/:id/servers/:serverId    # Remove server from profile
```

### OAuth

```http
GET    /api/oauth/start/:serverId   # Start OAuth flow
GET    /api/oauth/callback          # OAuth callback
DELETE /api/oauth/tokens/:serverId  # Revoke tokens
```

### MCP Proxy

```http
GET    /mcp/:slug              # SSE connection
POST   /mcp/:slug              # JSON-RPC request
```

### Debug

```http
GET    /debug/logs             # SSE log stream
GET    /api/debug/logs         # Get recent logs
DELETE /api/debug/logs         # Clear logs
```

---

## Authentication

### API Requests

Most API endpoints don't require authentication (local-only by design).

### OAuth Headers

For MCP servers with OAuth:
```http
Authorization: Bearer <access_token>
```

### API Key Headers

For MCP servers with API keys:
```http
X-Api-Key: <api_key>
# or
Authorization: Bearer <api_key>
```

---

## Common Response Formats

### Success Response

```json
{
  "id": "uuid",
  "name": "Example",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### Error Response

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

### List Response

```json
{
  "data": [...],
  "total": 10,
  "page": 1,
  "pageSize": 20
}
```

---

## Error Codes

| HTTP Status | Meaning |
|-------------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 404 | Not Found |
| 409 | Conflict (e.g., duplicate slug) |
| 500 | Internal Server Error |

---

## Content Types

### Request

```http
Content-Type: application/json
```

### Response

```http
Content-Type: application/json
# or for SSE
Content-Type: text/event-stream
```

---

## Rate Limiting

Default limits (configurable):

| Endpoint Type | Limit |
|---------------|-------|
| API requests | 100/min per IP |
| OAuth | 10/min per IP |
| Debug logs | 10/min per IP |

---

## CORS

By default, CORS allows all origins in development. Configure for production:

```bash
ALLOWED_ORIGINS=https://example.com,https://app.example.com
```

---

## See Also

- [REST API](./rest-api.md) - Complete endpoint reference
- [Proxy API](./proxy-api.md) - MCP proxy details
- [JSON-RPC Protocol](./json-rpc-protocol.md) - Protocol specification
