# Database Schema

Complete database schema reference for Local MCP Gateway.

## Overview

- **Database**: SQLite
- **ORM**: Drizzle
- **Location**: `~/.local-mcp-gateway-data/local-mcp-gateway.db`

---

## Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────────┐       ┌─────────────────┐
│    profiles     │       │  profile_mcp_servers │       │   mcp_servers   │
├─────────────────┤       ├─────────────────────┤       ├─────────────────┤
│ id (PK)         │───┐   │ profile_id (FK)     │   ┌───│ id (PK)         │
│ name (UNIQUE)   │   └──▶│ mcp_server_id (FK)  │◀──┘   │ name            │
│ description     │       │ order               │       │ type            │
│ created_at      │       └─────────────────────┘       │ config (JSON)   │
│ updated_at      │                                     │ oauth_config    │
└─────────────────┘                                     │ api_key_config  │
        │                                               │ created_at      │
        │                                               │ updated_at      │
        │                                               └─────────────────┘
        │                                                       │
        ▼                                                       │
┌─────────────────┐                                            │
│   debug_logs    │                                            │
├─────────────────┤                                            │
│ id (PK)         │                                            │
│ profile_id (FK) │                                            │
│ mcp_server_id   │◀───────────────────────────────────────────┘
│ request_type    │       ┌─────────────────┐
│ request_payload │       │  oauth_tokens   │
│ response_payload│       ├─────────────────┤
│ status          │       │ id (PK)         │
│ error_message   │       │ mcp_server_id   │◀──────────────────┐
│ duration_ms     │       │ access_token    │                   │
│ created_at      │       │ refresh_token   │                   │
└─────────────────┘       │ token_type      │                   │
                          │ expires_at      │                   │
                          │ scope           │                   │
                          │ created_at      │                   │
                          │ updated_at      │                   │
                          └─────────────────┘                   │
                                                                │
                          ┌─────────────────────────────┐       │
                          │ oauth_client_registrations  │       │
                          ├─────────────────────────────┤       │
                          │ id (PK)                     │       │
                          │ mcp_server_id (FK)          │◀──────┘
                          │ authorization_server_url    │
                          │ client_id                   │
                          │ client_secret               │
                          │ registration_access_token   │
                          │ created_at                  │
                          │ updated_at                  │
                          └─────────────────────────────┘
```

---

## Tables

### profiles

Stores profile definitions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| name | TEXT | NOT NULL, UNIQUE | Profile identifier |
| description | TEXT | | Optional description |
| created_at | INTEGER | NOT NULL | Unix timestamp |
| updated_at | INTEGER | NOT NULL | Unix timestamp |

**Indexes**:
- `idx_profiles_name` on `name`

### mcp_servers

Stores MCP server configurations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| name | TEXT | NOT NULL | Display name |
| type | TEXT | NOT NULL | Server type |
| config | TEXT (JSON) | NOT NULL | Type-specific config |
| oauth_config | TEXT (JSON) | | OAuth settings |
| api_key_config | TEXT (JSON) | | API key settings |
| created_at | INTEGER | NOT NULL | Unix timestamp |
| updated_at | INTEGER | NOT NULL | Unix timestamp |

**Indexes**:
- `idx_mcp_servers_type` on `type`

**Type Values**:
- `remote_http`
- `remote_sse`
- `external`
- `custom`

### profile_mcp_servers

Junction table for profile-server relationships.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| profile_id | TEXT | NOT NULL, FK | Reference to profiles |
| mcp_server_id | TEXT | NOT NULL, FK | Reference to mcp_servers |
| order | INTEGER | NOT NULL, DEFAULT 0 | Server priority |

**Indexes**:
- `pk_profile_mcp_servers` on `(profile_id, mcp_server_id)`
- `idx_profile_mcp_servers_profile` on `profile_id`
- `idx_profile_mcp_servers_mcp` on `mcp_server_id`

**Foreign Keys**:
- `profile_id` → `profiles.id` (CASCADE DELETE)
- `mcp_server_id` → `mcp_servers.id` (CASCADE DELETE)

### oauth_tokens

Stores OAuth tokens for MCP servers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| mcp_server_id | TEXT | NOT NULL, FK | Reference to mcp_servers |
| access_token | TEXT | NOT NULL | OAuth access token |
| refresh_token | TEXT | | OAuth refresh token |
| token_type | TEXT | NOT NULL, DEFAULT 'Bearer' | Token type |
| expires_at | INTEGER | | Expiration timestamp |
| scope | TEXT | | Granted scopes |
| created_at | INTEGER | NOT NULL | Unix timestamp |
| updated_at | INTEGER | NOT NULL | Unix timestamp |

**Foreign Keys**:
- `mcp_server_id` → `mcp_servers.id` (CASCADE DELETE)

### oauth_client_registrations

Caches Dynamic Client Registration results.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| mcp_server_id | TEXT | NOT NULL, FK | Reference to mcp_servers |
| authorization_server_url | TEXT | NOT NULL | Auth server URL |
| client_id | TEXT | NOT NULL | Registered client ID |
| client_secret | TEXT | | Client secret |
| registration_access_token | TEXT | | DCR management token |
| created_at | INTEGER | NOT NULL | Unix timestamp |
| updated_at | INTEGER | NOT NULL | Unix timestamp |

**Indexes**:
- `idx_oauth_client_registrations_unique` on `(mcp_server_id, authorization_server_url)`

**Foreign Keys**:
- `mcp_server_id` → `mcp_servers.id` (CASCADE DELETE)

### debug_logs

Stores MCP request/response logs.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| profile_id | TEXT | NOT NULL, FK | Reference to profiles |
| mcp_server_id | TEXT | FK | Reference to mcp_servers |
| request_type | TEXT | NOT NULL | MCP method name |
| request_payload | TEXT | NOT NULL | JSON request |
| response_payload | TEXT | | JSON response |
| status | TEXT | NOT NULL | pending/success/error |
| error_message | TEXT | | Error details |
| duration_ms | INTEGER | | Request duration |
| created_at | INTEGER | NOT NULL | Unix timestamp |

**Indexes**:
- `idx_debug_logs_profile` on `profile_id`
- `idx_debug_logs_mcp_server` on `mcp_server_id`
- `idx_debug_logs_created_at` on `created_at`

**Foreign Keys**:
- `profile_id` → `profiles.id` (CASCADE DELETE)
- `mcp_server_id` → `mcp_servers.id` (SET NULL)

### migrations

Tracks executed migrations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| name | TEXT | NOT NULL, UNIQUE | Migration name |
| executed_at | INTEGER | NOT NULL | Execution timestamp |

---

## JSON Schema: config

### Remote HTTP Config

```json
{
  "url": "https://api.example.com/mcp"
}
```

### Remote SSE Config

```json
{
  "url": "https://api.example.com/mcp",
  "sseEndpoint": "/sse",
  "postEndpoint": "/message"
}
```

### External Config

```json
{
  "command": "node",
  "args": ["server.js"],
  "env": { "KEY": "value" },
  "cwd": "/path/to/dir"
}
```

### Custom Config

```json
{
  "modulePath": "./custom-mcps/my-server"
}
```

---

## JSON Schema: oauth_config

```json
{
  "authorizationUrl": "https://auth.example.com/authorize",
  "tokenUrl": "https://auth.example.com/token",
  "clientId": "client-id",
  "clientSecret": "client-secret",
  "scopes": "read write"
}
```

---

## JSON Schema: api_key_config

```json
{
  "apiKey": "sk-abc123...",
  "headerName": "Authorization",
  "headerValueTemplate": "Bearer {key}"
}
```

---

## Drizzle Schema

Located at: `packages/database/src/schema.ts`

```typescript
export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const mcpServers = sqliteTable('mcp_servers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  config: text('config', { mode: 'json' }).notNull(),
  oauthConfig: text('oauth_config', { mode: 'json' }),
  apiKeyConfig: text('api_key_config', { mode: 'json' }),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
```

---

## See Also

- [Database README](./README.md) - Overview
- [Migrations](./migrations.md) - Migration guide
