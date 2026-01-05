# Users Database Schema

Database schema for users and organizations.

## Overview

The user management schema supports both individual users and organization-based teams.

---

## Entity Relationship

```
users ─────────────────┬───────── organization_members ───────── organizations
                       │                                              │
                       │                                              │
                       ▼                                              ▼
              user_oauth_accounts                              subscriptions
                                                                      │
                                                                      ▼
                                                                  invoices
```

---

## Tables

### users

Core user table for authentication and identity.

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),

  -- Identity
  email TEXT NOT NULL UNIQUE,
  email_verified INTEGER NOT NULL DEFAULT 0,
  email_verification_token TEXT,
  email_verification_expires INTEGER,

  -- Authentication
  password_hash TEXT,  -- NULL for OAuth-only users

  -- Profile
  name TEXT,
  avatar_url TEXT,

  -- Settings
  preferred_currency TEXT DEFAULT 'usd',
  timezone TEXT DEFAULT 'UTC',

  -- Status
  status TEXT NOT NULL DEFAULT 'active',  -- active, suspended, deleted
  suspended_reason TEXT,

  -- Timestamps
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  last_login_at INTEGER
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
```

### Drizzle Schema

```typescript
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

  // Identity
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  emailVerificationToken: text('email_verification_token'),
  emailVerificationExpires: integer('email_verification_expires'),

  // Authentication
  passwordHash: text('password_hash'),

  // Profile
  name: text('name'),
  avatarUrl: text('avatar_url'),

  // Settings
  preferredCurrency: text('preferred_currency').default('usd'),
  timezone: text('timezone').default('UTC'),

  // Status
  status: text('status').notNull().default('active'),
  suspendedReason: text('suspended_reason'),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  lastLoginAt: integer('last_login_at', { mode: 'timestamp' }),
}, (table) => ({
  emailIdx: index('idx_users_email').on(table.email),
  statusIdx: index('idx_users_status').on(table.status),
}));
```

---

### organizations

Team/company entities for multi-user accounts.

```sql
CREATE TABLE organizations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),

  -- Identity
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,

  -- Billing
  billing_email TEXT,
  billing_name TEXT,
  billing_address TEXT,  -- JSON
  tax_id TEXT,

  -- Payment provider
  paddle_customer_id TEXT,
  stripe_customer_id TEXT,

  -- Settings
  default_currency TEXT DEFAULT 'usd',

  -- Timestamps
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Indexes
CREATE UNIQUE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_paddle_customer ON organizations(paddle_customer_id);
```

### Drizzle Schema

```typescript
export const organizations = sqliteTable('organizations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

  // Identity
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),

  // Billing
  billingEmail: text('billing_email'),
  billingName: text('billing_name'),
  billingAddress: text('billing_address'),  // JSON string
  taxId: text('tax_id'),

  // Payment provider
  paddleCustomerId: text('paddle_customer_id'),
  stripeCustomerId: text('stripe_customer_id'),

  // Settings
  defaultCurrency: text('default_currency').default('usd'),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});
```

---

### organization_members

Join table for organization membership.

```sql
CREATE TABLE organization_members (
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Role
  role TEXT NOT NULL DEFAULT 'member',  -- owner, admin, member

  -- Invitation
  invited_by TEXT REFERENCES users(id),
  invited_at INTEGER,
  accepted_at INTEGER,

  -- Timestamps
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),

  PRIMARY KEY (organization_id, user_id)
);

-- Indexes
CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_org_members_role ON organization_members(role);
```

### Drizzle Schema

```typescript
export const organizationMembers = sqliteTable('organization_members', {
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Role
  role: text('role').notNull().default('member'),

  // Invitation
  invitedBy: text('invited_by').references(() => users.id),
  invitedAt: integer('invited_at', { mode: 'timestamp' }),
  acceptedAt: integer('accepted_at', { mode: 'timestamp' }),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  pk: primaryKey({ columns: [table.organizationId, table.userId] }),
  userIdx: index('idx_org_members_user').on(table.userId),
  roleIdx: index('idx_org_members_role').on(table.role),
}));
```

---

### user_oauth_accounts

OAuth provider connections.

```sql
CREATE TABLE user_oauth_accounts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Provider
  provider TEXT NOT NULL,  -- 'github', 'google'
  provider_user_id TEXT NOT NULL,
  provider_email TEXT,

  -- Tokens (encrypted)
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at INTEGER,

  -- Profile data
  provider_data TEXT,  -- JSON with provider-specific data

  -- Timestamps
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),

  UNIQUE(provider, provider_user_id)
);

-- Indexes
CREATE INDEX idx_oauth_user ON user_oauth_accounts(user_id);
CREATE INDEX idx_oauth_provider ON user_oauth_accounts(provider, provider_user_id);
```

---

### sessions

User session management.

```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Session data
  ip_address TEXT,
  user_agent TEXT,

  -- Expiration
  expires_at INTEGER NOT NULL,

  -- Timestamps
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  last_active_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Indexes
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
```

---

## Roles and Permissions

### Organization Roles

| Role | Permissions |
|------|-------------|
| **owner** | Full access, billing, delete org |
| **admin** | Manage members, profiles, servers |
| **member** | Use profiles and servers |

### Permission Check Example

```typescript
async function canManageMembers(userId: string, orgId: string): Promise<boolean> {
  const membership = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.userId, userId),
      eq(organizationMembers.organizationId, orgId)
    )
  });

  return membership?.role === 'owner' || membership?.role === 'admin';
}
```

---

## Query Examples

### Get User with Organizations

```typescript
const userWithOrgs = await db.query.users.findFirst({
  where: eq(users.id, userId),
  with: {
    organizationMemberships: {
      with: {
        organization: true
      }
    }
  }
});
```

### Get Organization Members

```typescript
const members = await db.query.organizationMembers.findMany({
  where: eq(organizationMembers.organizationId, orgId),
  with: {
    user: {
      columns: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true
      }
    }
  }
});
```

---

## See Also

- [Subscriptions Schema](./subscriptions-schema.md) - Billing tables
- [License Keys Schema](./license-keys-schema.md) - License tables
- [Auth API](../api/auth-api.md) - Authentication endpoints
