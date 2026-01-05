# Subscriptions Database Schema

Database schema for subscriptions, billing, and invoices.

## Overview

The subscription schema handles both individual and organization subscriptions, integrating with payment providers like Paddle or Stripe.

---

## Entity Relationship

```
users ──────────┬─────────────────────────────────────┐
                │                                     │
                ▼                                     │
         subscriptions ◄──────── organizations ◄──────┘
                │
                ├──────────────┬──────────────┐
                ▼              ▼              ▼
            invoices    usage_records    subscription_events
```

---

## Tables

### subscriptions

Core subscription table.

```sql
CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),

  -- Owner (one of these must be set)
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,

  -- Subscription details
  tier TEXT NOT NULL,  -- 'free', 'pro', 'team', 'enterprise'
  status TEXT NOT NULL DEFAULT 'active',  -- active, trialing, past_due, canceled, paused

  -- Payment provider
  provider TEXT,  -- 'paddle', 'stripe', NULL for free
  paddle_subscription_id TEXT,
  paddle_price_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,

  -- Billing
  billing_cycle TEXT,  -- 'monthly', 'annual'
  currency TEXT DEFAULT 'usd',
  amount_cents INTEGER,

  -- Period
  current_period_start INTEGER NOT NULL,
  current_period_end INTEGER NOT NULL,
  trial_end INTEGER,

  -- Cancellation
  cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
  canceled_at INTEGER,
  cancellation_reason TEXT,

  -- Seats (for team plans)
  seat_count INTEGER DEFAULT 1,
  seat_limit INTEGER,

  -- Timestamps
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),

  CHECK (user_id IS NOT NULL OR organization_id IS NOT NULL)
);

-- Indexes
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_org ON subscriptions(organization_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_paddle ON subscriptions(paddle_subscription_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
```

### Drizzle Schema

```typescript
export const subscriptions = sqliteTable('subscriptions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

  // Owner
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  organizationId: text('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),

  // Subscription details
  tier: text('tier').notNull(),
  status: text('status').notNull().default('active'),

  // Payment provider
  provider: text('provider'),
  paddleSubscriptionId: text('paddle_subscription_id'),
  paddlePriceId: text('paddle_price_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  stripePriceId: text('stripe_price_id'),

  // Billing
  billingCycle: text('billing_cycle'),
  currency: text('currency').default('usd'),
  amountCents: integer('amount_cents'),

  // Period
  currentPeriodStart: integer('current_period_start', { mode: 'timestamp' }).notNull(),
  currentPeriodEnd: integer('current_period_end', { mode: 'timestamp' }).notNull(),
  trialEnd: integer('trial_end', { mode: 'timestamp' }),

  // Cancellation
  cancelAtPeriodEnd: integer('cancel_at_period_end', { mode: 'boolean' }).notNull().default(false),
  canceledAt: integer('canceled_at', { mode: 'timestamp' }),
  cancellationReason: text('cancellation_reason'),

  // Seats
  seatCount: integer('seat_count').default(1),
  seatLimit: integer('seat_limit'),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});
```

---

### invoices

Invoice records for billing history.

```sql
CREATE TABLE invoices (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  subscription_id TEXT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,

  -- Provider reference
  paddle_invoice_id TEXT,
  stripe_invoice_id TEXT,

  -- Invoice details
  invoice_number TEXT,
  status TEXT NOT NULL,  -- draft, open, paid, void, uncollectible

  -- Amounts
  subtotal_cents INTEGER NOT NULL,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',

  -- Tax details
  tax_rate REAL,
  tax_country TEXT,

  -- Period
  period_start INTEGER NOT NULL,
  period_end INTEGER NOT NULL,

  -- Payment
  paid_at INTEGER,
  payment_method TEXT,

  -- Documents
  invoice_pdf_url TEXT,
  receipt_url TEXT,

  -- Timestamps
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Indexes
CREATE INDEX idx_invoices_subscription ON invoices(subscription_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_paddle ON invoices(paddle_invoice_id);
```

---

### usage_records

Track usage for metered billing and quota enforcement.

```sql
CREATE TABLE usage_records (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  subscription_id TEXT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,

  -- Metric
  metric TEXT NOT NULL,  -- 'mcp_requests', 'profiles', 'servers'

  -- Value
  quantity INTEGER NOT NULL,

  -- Period
  period_start INTEGER NOT NULL,
  period_end INTEGER NOT NULL,

  -- Reporting (for metered billing)
  reported_to_provider INTEGER NOT NULL DEFAULT 0,
  reported_at INTEGER,

  -- Timestamps
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Indexes
CREATE INDEX idx_usage_subscription ON usage_records(subscription_id);
CREATE INDEX idx_usage_metric ON usage_records(metric);
CREATE INDEX idx_usage_period ON usage_records(period_start, period_end);
```

---

### subscription_events

Audit log for subscription changes.

```sql
CREATE TABLE subscription_events (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  subscription_id TEXT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,

  -- Event
  event_type TEXT NOT NULL,  -- created, upgraded, downgraded, canceled, reactivated, payment_failed

  -- Details
  previous_tier TEXT,
  new_tier TEXT,
  previous_status TEXT,
  new_status TEXT,

  -- Metadata
  metadata TEXT,  -- JSON with additional data

  -- Source
  triggered_by TEXT,  -- 'user', 'admin', 'webhook', 'system'
  user_id TEXT REFERENCES users(id),

  -- Timestamps
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Indexes
CREATE INDEX idx_events_subscription ON subscription_events(subscription_id);
CREATE INDEX idx_events_type ON subscription_events(event_type);
CREATE INDEX idx_events_created ON subscription_events(created_at);
```

---

## Tier Configuration

### Tier Limits Table

```sql
CREATE TABLE tier_limits (
  tier TEXT PRIMARY KEY,

  -- Limits
  max_profiles INTEGER,
  max_servers INTEGER,
  daily_request_limit INTEGER,
  debug_log_retention_hours INTEGER,

  -- Features (JSON)
  features TEXT NOT NULL DEFAULT '{}',

  -- Timestamps
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Seed data
INSERT INTO tier_limits (tier, max_profiles, max_servers, daily_request_limit, debug_log_retention_hours, features)
VALUES
  ('free', 1, 3, 1000, 1, '{"external_servers":false,"custom_servers":false}'),
  ('pro', 10, NULL, 50000, 168, '{"external_servers":true,"custom_servers":true,"webhooks":true}'),
  ('team', NULL, NULL, 200000, 720, '{"external_servers":true,"custom_servers":true,"webhooks":true,"audit_logs":true}'),
  ('enterprise', NULL, NULL, NULL, 8760, '{"external_servers":true,"custom_servers":true,"webhooks":true,"audit_logs":true,"sso":true}');
```

---

## Query Examples

### Get Active Subscription

```typescript
async function getSubscription(userId: string): Promise<Subscription | null> {
  // Try user subscription first
  let subscription = await db.query.subscriptions.findFirst({
    where: and(
      eq(subscriptions.userId, userId),
      eq(subscriptions.status, 'active')
    )
  });

  if (subscription) return subscription;

  // Check organization subscriptions
  const memberships = await db.query.organizationMembers.findMany({
    where: eq(organizationMembers.userId, userId),
    with: {
      organization: {
        with: {
          subscription: true
        }
      }
    }
  });

  for (const membership of memberships) {
    if (membership.organization?.subscription?.status === 'active') {
      return membership.organization.subscription;
    }
  }

  return null;
}
```

### Get Usage for Period

```typescript
async function getUsage(subscriptionId: string, metric: string): Promise<number> {
  const now = new Date();
  const periodStart = startOfMonth(now);
  const periodEnd = endOfMonth(now);

  const records = await db.query.usageRecords.findMany({
    where: and(
      eq(usageRecords.subscriptionId, subscriptionId),
      eq(usageRecords.metric, metric),
      gte(usageRecords.periodStart, periodStart.getTime()),
      lte(usageRecords.periodEnd, periodEnd.getTime())
    )
  });

  return records.reduce((sum, r) => sum + r.quantity, 0);
}
```

### Record Usage

```typescript
async function recordUsage(
  subscriptionId: string,
  metric: string,
  quantity: number
): Promise<void> {
  const now = new Date();
  const periodStart = startOfDay(now);
  const periodEnd = endOfDay(now);

  await db.insert(usageRecords).values({
    subscriptionId,
    metric,
    quantity,
    periodStart: periodStart.getTime(),
    periodEnd: periodEnd.getTime()
  });
}
```

---

## Subscription Status Flow

```
trialing ──────────────────────────┐
    │                              │
    │ trial ends                   │ trial ends
    │ payment success              │ payment failed
    │                              │
    ▼                              ▼
 active ◄─────────────────────► past_due
    │                              │
    │ cancel                       │ payment success
    │                              │
    ▼                              │
canceled ◄─────────────────────────┘
    │                           grace period
    │ reactivate                   expires
    │                              │
    ▼                              ▼
 active                         canceled
```

---

## See Also

- [Users Schema](./users-schema.md) - User tables
- [License Keys Schema](./license-keys-schema.md) - License tables
- [Subscriptions API](../api/subscriptions-api.md) - API endpoints
