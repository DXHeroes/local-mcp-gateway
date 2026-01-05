# Profiles API

REST API for managing profiles.

## Overview

Profiles aggregate MCP servers into named collections with unique endpoints.

---

## Endpoints

### List Profiles

```http
GET /api/profiles
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid-1",
      "name": "Development",
      "slug": "development",
      "description": "Development tools",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z",
      "servers": [
        {
          "id": "server-uuid",
          "name": "GitHub",
          "type": "remote_http"
        }
      ]
    }
  ]
}
```

---

### Get Profile

```http
GET /api/profiles/:id
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Profile UUID |

**Response:**
```json
{
  "id": "uuid-1",
  "name": "Development",
  "slug": "development",
  "description": "Development tools",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z",
  "servers": [
    {
      "id": "server-uuid",
      "name": "GitHub",
      "type": "remote_http",
      "status": "connected"
    }
  ]
}
```

**Errors:**

| Status | Code | Description |
|--------|------|-------------|
| 404 | PROFILE_NOT_FOUND | Profile doesn't exist |

---

### Get Profile by Slug

```http
GET /api/profiles/by-slug/:slug
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| slug | string | Profile slug |

**Response:** Same as Get Profile

---

### Create Profile

```http
POST /api/profiles
```

**Request Body:**
```json
{
  "name": "Development",
  "slug": "development",
  "description": "Development tools"
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Display name |
| slug | string | Yes | URL-safe identifier |
| description | string | No | Description |

**Response:**
```json
{
  "id": "new-uuid",
  "name": "Development",
  "slug": "development",
  "description": "Development tools",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z",
  "servers": []
}
```

**Errors:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_SLUG | Slug contains invalid characters |
| 409 | SLUG_EXISTS | Slug already in use |

---

### Update Profile

```http
PUT /api/profiles/:id
```

**Request Body:**
```json
{
  "name": "Dev Tools",
  "description": "Updated description"
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | No | New display name |
| slug | string | No | New slug |
| description | string | No | New description |

**Response:** Updated profile object

**Errors:**

| Status | Code | Description |
|--------|------|-------------|
| 404 | PROFILE_NOT_FOUND | Profile doesn't exist |
| 409 | SLUG_EXISTS | New slug already in use |

---

### Delete Profile

```http
DELETE /api/profiles/:id
```

**Response:**
```json
{
  "success": true
}
```

**Errors:**

| Status | Code | Description |
|--------|------|-------------|
| 404 | PROFILE_NOT_FOUND | Profile doesn't exist |

---

## Server Management

### Add Server to Profile

```http
POST /api/profiles/:id/servers/:serverId
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | Profile UUID |
| serverId | string | Server UUID |

**Response:**
```json
{
  "success": true,
  "profile": { /* updated profile */ }
}
```

**Errors:**

| Status | Code | Description |
|--------|------|-------------|
| 404 | PROFILE_NOT_FOUND | Profile doesn't exist |
| 404 | SERVER_NOT_FOUND | Server doesn't exist |
| 409 | ALREADY_ADDED | Server already in profile |

---

### Remove Server from Profile

```http
DELETE /api/profiles/:id/servers/:serverId
```

**Response:**
```json
{
  "success": true,
  "profile": { /* updated profile */ }
}
```

**Errors:**

| Status | Code | Description |
|--------|------|-------------|
| 404 | PROFILE_NOT_FOUND | Profile doesn't exist |
| 404 | SERVER_NOT_IN_PROFILE | Server not in profile |

---

## Slug Rules

Slugs must be:
- Lowercase letters, numbers, hyphens only
- Start with a letter
- 3-50 characters
- Unique across all profiles

**Valid:** `development`, `my-tools-2024`, `prod`

**Invalid:** `Development`, `my tools`, `123`, `-test`

---

## See Also

- [MCP Servers API](./mcp-servers-api.md) - Server management
- [Proxy API](./proxy-api.md) - Using profile endpoints
