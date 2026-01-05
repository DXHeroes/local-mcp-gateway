# Database Migrations

Migration system for Local MCP Gateway database.

## Overview

Local MCP Gateway uses Drizzle ORM's migration system for schema changes.

---

## Migration System

### How It Works

1. Schema defined in `packages/database/src/schema.ts`
2. Migrations generated from schema changes
3. Migrations run automatically on startup
4. Migration state tracked in `__drizzle_migrations` table

---

## Generating Migrations

### After Schema Changes

```bash
cd packages/database
pnpm drizzle-kit generate
```

This creates SQL migration files in `src/migrations/`.

### Migration File Structure

```
packages/database/
└── src/
    └── migrations/
        ├── 0000_initial.sql
        ├── 0001_add_oauth_tokens.sql
        ├── 0002_add_debug_logs.sql
        └── meta/
            └── _journal.json
```

---

## Running Migrations

### Automatic (Startup)

Migrations run automatically when gateway starts:

```typescript
// In backend initialization
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

migrate(db, { migrationsFolder: './migrations' });
```

### Manual

```bash
pnpm db:migrate
```

### Check Migration Status

```bash
pnpm drizzle-kit status
```

---

## Creating Migrations

### Example: Adding a Column

1. **Update schema.ts:**

```typescript
// Before
export const mcpServers = sqliteTable('mcp_servers', {
  id: text('id').primaryKey(),
  name: text('name').notNull()
});

// After
export const mcpServers = sqliteTable('mcp_servers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description')  // New column
});
```

2. **Generate migration:**

```bash
pnpm drizzle-kit generate
```

3. **Generated SQL:**

```sql
-- 0003_add_description.sql
ALTER TABLE mcp_servers ADD COLUMN description TEXT;
```

---

### Example: Adding a Table

1. **Update schema.ts:**

```typescript
export const newTable = sqliteTable('new_table', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});
```

2. **Generate and run migration.**

---

### Example: Adding an Index

```typescript
export const mcpServers = sqliteTable('mcp_servers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull()
}, (table) => ({
  typeIdx: index('type_idx').on(table.type)
}));
```

---

## Migration Best Practices

### Do

- Always generate migrations for schema changes
- Test migrations on copy of production data
- Keep migrations small and focused
- Include both up and down logic when possible
- Back up database before major migrations

### Don't

- Manually edit generated migrations (unless necessary)
- Delete old migrations
- Change migration files after they've been applied
- Skip migrations in production

---

## Rollback

### SQLite Limitations

SQLite has limited ALTER TABLE support:
- Can add columns
- Cannot drop columns (before SQLite 3.35)
- Cannot rename columns (before SQLite 3.25)

### Manual Rollback

For complex rollbacks, recreate table:

```sql
-- 1. Create new table with desired schema
CREATE TABLE mcp_servers_new (...);

-- 2. Copy data
INSERT INTO mcp_servers_new SELECT ... FROM mcp_servers;

-- 3. Drop old table
DROP TABLE mcp_servers;

-- 4. Rename new table
ALTER TABLE mcp_servers_new RENAME TO mcp_servers;
```

---

## Database Reset

### Development Reset

```bash
pnpm db:reset
```

This:
1. Deletes database file
2. Runs all migrations fresh
3. Optionally seeds with test data

### Production Reset (Caution!)

```bash
# Back up first!
cp ~/.local-mcp-gateway-data/local-mcp-gateway.db ./backup-$(date +%Y%m%d).db

# Reset
rm ~/.local-mcp-gateway-data/local-mcp-gateway.db*

# Restart gateway (runs migrations)
pnpm start
```

---

## Drizzle Configuration

### drizzle.config.ts

```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/schema.ts',
  out: './src/migrations',
  driver: 'better-sqlite',
  dbCredentials: {
    url: process.env.DATABASE_PATH ||
         '~/.local-mcp-gateway-data/local-mcp-gateway.db'
  }
} satisfies Config;
```

---

## Migration Commands

| Command | Description |
|---------|-------------|
| `pnpm drizzle-kit generate` | Generate migrations from schema |
| `pnpm drizzle-kit migrate` | Run pending migrations |
| `pnpm drizzle-kit status` | Check migration status |
| `pnpm drizzle-kit studio` | Open Drizzle Studio UI |
| `pnpm db:reset` | Reset database |
| `pnpm db:seed` | Seed with test data |

---

## Troubleshooting

### Migration Failed

**Cause**: SQL error in migration.

**Solution**:
1. Check migration SQL for errors
2. Fix and regenerate
3. Reset database if in development

### Out of Sync

**Cause**: Schema and migrations don't match.

**Solution**:
```bash
pnpm drizzle-kit status
# If needed
pnpm drizzle-kit generate
```

### Duplicate Migration

**Cause**: Migration already applied.

**Solution**: Check `__drizzle_migrations` table:
```sql
SELECT * FROM __drizzle_migrations;
```

---

## See Also

- [Schema](./schema.md) - Database schema
- [Database README](./README.md) - Database overview
- [Drizzle Documentation](https://orm.drizzle.team/docs/migrations) - Official docs
