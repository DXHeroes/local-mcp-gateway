# Database Documentation

Technical documentation for Local MCP Gateway database layer.

## Overview

Local MCP Gateway uses SQLite with Drizzle ORM for data persistence.

---

## Documentation Index

| Document | Description |
|----------|-------------|
| [Schema](./schema.md) | Complete database schema |
| [Migrations](./migrations.md) | Migration system |

---

## Technology Stack

| Component | Technology |
|-----------|------------|
| Database | SQLite |
| ORM | Drizzle ORM |
| Driver | better-sqlite3 |
| Location | `~/.local-mcp-gateway-data/local-mcp-gateway.db` |

---

## Database Package

Located in `packages/database/`:

```
packages/database/
├── src/
│   ├── index.ts          # Package exports
│   ├── schema.ts         # Drizzle schema definitions
│   ├── db.ts             # Database connection
│   └── migrations/       # SQL migrations
├── drizzle.config.ts     # Drizzle configuration
└── package.json
```

---

## Tables Overview

| Table | Purpose |
|-------|---------|
| `profiles` | User-defined profile collections |
| `mcp_servers` | MCP server configurations |
| `profile_mcp_servers` | Profile-server relationships |
| `oauth_tokens` | Encrypted OAuth tokens |
| `oauth_client_registrations` | DCR client credentials |
| `debug_logs` | MCP traffic logs (optional) |

---

## Entity Relationships

```
profiles ─────────┬───────── profile_mcp_servers ─────────┬───────── mcp_servers
                  │                                       │
                  │         (many-to-many)                │
                  │                                       │
                  └───────────────────────────────────────┘
                                    │
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
              oauth_tokens    oauth_client    debug_logs
                              registrations
```

---

## Connection Management

### Initialization

```typescript
import { createDb } from '@local-mcp/database';

const db = createDb({
  path: process.env.DATABASE_PATH ||
        '~/.local-mcp-gateway-data/local-mcp-gateway.db'
});
```

### Connection Options

| Option | Default | Description |
|--------|---------|-------------|
| path | `~/.local-mcp-gateway-data/...` | Database file path |
| verbose | false | Log all queries |

---

## Query Examples

### List Profiles with Servers

```typescript
const profiles = await db.query.profiles.findMany({
  with: {
    profileMcpServers: {
      with: {
        mcpServer: true
      }
    }
  }
});
```

### Get Server with OAuth Status

```typescript
const server = await db.query.mcpServers.findFirst({
  where: eq(mcpServers.id, serverId),
  with: {
    oauthTokens: true
  }
});
```

### Create Profile with Transaction

```typescript
await db.transaction(async (tx) => {
  const profile = await tx.insert(profiles).values({
    name: 'New Profile',
    slug: 'new-profile'
  }).returning();

  await tx.insert(profileMcpServers).values({
    profileId: profile[0].id,
    mcpServerId: serverId
  });
});
```

---

## Data Storage

### Default Location

```bash
# macOS/Linux
~/.local-mcp-gateway-data/local-mcp-gateway.db

# Windows
%USERPROFILE%\.local-mcp-gateway-data\local-mcp-gateway.db
```

### Custom Location

```bash
DATABASE_PATH=/custom/path/database.db
```

### Data Directory Structure

```
~/.local-mcp-gateway-data/
├── local-mcp-gateway.db     # Main database
├── local-mcp-gateway.db-wal # Write-ahead log
└── local-mcp-gateway.db-shm # Shared memory
```

---

## Backup and Restore

### Backup

```bash
# Simple copy (when gateway stopped)
cp ~/.local-mcp-gateway-data/local-mcp-gateway.db ./backup.db

# With WAL checkpoint (while running)
sqlite3 ~/.local-mcp-gateway-data/local-mcp-gateway.db "PRAGMA wal_checkpoint(TRUNCATE);"
cp ~/.local-mcp-gateway-data/local-mcp-gateway.db ./backup.db
```

### Restore

```bash
cp ./backup.db ~/.local-mcp-gateway-data/local-mcp-gateway.db
```

---

## Performance

### Indexes

Indexes created on:
- `profiles.slug` (unique)
- `mcp_servers.id`
- `oauth_tokens.server_id`
- Foreign key columns

### WAL Mode

SQLite configured with Write-Ahead Logging:
```sql
PRAGMA journal_mode=WAL;
```

Benefits:
- Better concurrent read performance
- Improved write performance
- Crash recovery

---

## Troubleshooting

### Database Locked

**Cause**: Multiple processes accessing database.

**Solution**: Ensure only one gateway instance runs.

### Corrupted Database

**Solution**:
```bash
sqlite3 old.db ".dump" | sqlite3 new.db
```

### Reset Database

```bash
pnpm db:reset
```

Or manually:
```bash
rm ~/.local-mcp-gateway-data/local-mcp-gateway.db*
```

---

## See Also

- [Schema](./schema.md) - Table definitions
- [Migrations](./migrations.md) - Migration system
- [Environment Variables](../configuration/environment-variables.md) - Configuration
