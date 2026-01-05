# License Keys Database Schema

Database schema for self-hosted license key management.

## Overview

The license key system enables self-hosted commercial deployments with cryptographic validation support for both online and offline scenarios.

---

## Entity Relationship

```
users ────────────┬─────────────────────────────────────┐
                  │                                     │
                  ▼                                     │
           license_keys ◄──────── organizations ◄──────┘
                  │
                  ▼
        license_activations
```

---

## Tables

### license_keys

Master table for generated license keys.

```sql
CREATE TABLE license_keys (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),

  -- Owner (one must be set)
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  organization_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,

  -- Key identification
  key_prefix TEXT NOT NULL,        -- First 8 chars for lookup (e.g., "LMG-BUS-")
  key_hash TEXT NOT NULL UNIQUE,   -- SHA256 of full key (for validation)

  -- License terms
  tier TEXT NOT NULL,              -- 'startup', 'business', 'enterprise'

  -- Limits
  max_users INTEGER,               -- NULL = unlimited
  max_profiles INTEGER,            -- NULL = unlimited
  max_servers INTEGER,             -- NULL = unlimited
  max_activations INTEGER DEFAULT 1,

  -- Validity
  valid_from INTEGER NOT NULL,
  valid_until INTEGER,             -- NULL = perpetual

  -- Features (JSON)
  features TEXT NOT NULL DEFAULT '{}',

  -- Status
  status TEXT NOT NULL DEFAULT 'active',  -- active, revoked, expired
  revocation_reason TEXT,
  revoked_at INTEGER,
  revoked_by TEXT REFERENCES users(id),

  -- Metadata
  notes TEXT,

  -- Timestamps
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),

  CHECK (user_id IS NOT NULL OR organization_id IS NOT NULL)
);

-- Indexes
CREATE INDEX idx_license_keys_prefix ON license_keys(key_prefix);
CREATE UNIQUE INDEX idx_license_keys_hash ON license_keys(key_hash);
CREATE INDEX idx_license_keys_user ON license_keys(user_id);
CREATE INDEX idx_license_keys_org ON license_keys(organization_id);
CREATE INDEX idx_license_keys_status ON license_keys(status);
CREATE INDEX idx_license_keys_tier ON license_keys(tier);
```

### Drizzle Schema

```typescript
export const licenseKeys = sqliteTable('license_keys', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

  // Owner
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  organizationId: text('organization_id').references(() => organizations.id, { onDelete: 'set null' }),

  // Key identification
  keyPrefix: text('key_prefix').notNull(),
  keyHash: text('key_hash').notNull().unique(),

  // License terms
  tier: text('tier').notNull(),

  // Limits
  maxUsers: integer('max_users'),
  maxProfiles: integer('max_profiles'),
  maxServers: integer('max_servers'),
  maxActivations: integer('max_activations').default(1),

  // Validity
  validFrom: integer('valid_from', { mode: 'timestamp' }).notNull(),
  validUntil: integer('valid_until', { mode: 'timestamp' }),

  // Features
  features: text('features').notNull().default('{}'),

  // Status
  status: text('status').notNull().default('active'),
  revocationReason: text('revocation_reason'),
  revokedAt: integer('revoked_at', { mode: 'timestamp' }),
  revokedBy: text('revoked_by').references(() => users.id),

  // Metadata
  notes: text('notes'),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});
```

---

### license_activations

Tracks where license keys are activated.

```sql
CREATE TABLE license_activations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  license_key_id TEXT NOT NULL REFERENCES license_keys(id) ON DELETE CASCADE,

  -- Instance identification
  instance_id TEXT NOT NULL,       -- Unique per installation
  instance_name TEXT,              -- User-friendly name

  -- Environment info
  hostname TEXT,
  os_type TEXT,
  os_version TEXT,
  app_version TEXT,

  -- Network (for support)
  ip_address TEXT,

  -- Activation tracking
  first_activated_at INTEGER NOT NULL,
  last_validated_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,

  -- Status
  is_active INTEGER NOT NULL DEFAULT 1,
  deactivated_at INTEGER,
  deactivation_reason TEXT,

  -- Timestamps
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),

  UNIQUE(license_key_id, instance_id)
);

-- Indexes
CREATE INDEX idx_activations_license ON license_activations(license_key_id);
CREATE INDEX idx_activations_instance ON license_activations(instance_id);
CREATE INDEX idx_activations_active ON license_activations(is_active);
CREATE INDEX idx_activations_last_seen ON license_activations(last_seen_at);
```

---

### license_validation_logs

Audit trail for license validations.

```sql
CREATE TABLE license_validation_logs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  license_key_id TEXT REFERENCES license_keys(id) ON DELETE SET NULL,

  -- Request details
  key_prefix TEXT NOT NULL,        -- For lookup even if key deleted
  instance_id TEXT,
  ip_address TEXT,

  -- Result
  success INTEGER NOT NULL,
  failure_reason TEXT,

  -- Response
  response_code TEXT,              -- 'valid', 'expired', 'revoked', 'limit_exceeded', etc.

  -- Timestamps
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Indexes
CREATE INDEX idx_validation_logs_key ON license_validation_logs(license_key_id);
CREATE INDEX idx_validation_logs_prefix ON license_validation_logs(key_prefix);
CREATE INDEX idx_validation_logs_created ON license_validation_logs(created_at);
```

---

## License Key Format

### Key Structure

```
LMG-{TIER}-{RANDOM_PART}-{CHECKSUM}

Example: LMG-BUS-K9X2M-P4N7Q-R3V8T-J6W1Y-A5C2
```

| Part | Length | Description |
|------|--------|-------------|
| Prefix | 4 | `LMG-` (product identifier) |
| Tier | 3-4 | `STR` (Startup), `BUS` (Business), `ENT` (Enterprise) |
| Random | 20 | Base32 random characters |
| Checksum | 4 | CRC32 for basic validation |

### Signed Payload

The key actually encodes a signed JSON payload:

```json
{
  "lid": "license-uuid",
  "tier": "business",
  "org": "org-uuid",
  "lim": {
    "users": 100,
    "profiles": null,
    "servers": null
  },
  "feat": ["external", "custom", "webhooks"],
  "exp": 1735689600,
  "iat": 1704153600
}
```

This payload is:
1. JSON stringified
2. Signed with Ed25519 private key
3. Base64 encoded
4. Formatted as display key

---

## Tier Configurations

```sql
CREATE TABLE license_tiers (
  tier TEXT PRIMARY KEY,

  -- Limits
  max_users INTEGER,
  max_profiles INTEGER,
  max_servers INTEGER,
  max_activations INTEGER,

  -- Features
  features TEXT NOT NULL DEFAULT '[]',  -- JSON array

  -- Offline
  offline_grace_days INTEGER NOT NULL DEFAULT 7,

  -- Pricing
  annual_price_cents INTEGER NOT NULL,

  -- Timestamps
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Seed data
INSERT INTO license_tiers VALUES
  ('startup', 20, NULL, NULL, 1, '["external","custom"]', 7, 9900),
  ('business', 100, NULL, NULL, 3, '["external","custom","webhooks"]', 30, 49900),
  ('enterprise', NULL, NULL, NULL, NULL, '["external","custom","webhooks","ha","air_gapped"]', 365, NULL);
```

---

## Query Examples

### Validate License Key

```typescript
async function validateLicenseKey(
  keyPrefix: string,
  keyHash: string,
  instanceId: string
): Promise<ValidationResult> {
  // Find license
  const license = await db.query.licenseKeys.findFirst({
    where: and(
      eq(licenseKeys.keyPrefix, keyPrefix),
      eq(licenseKeys.keyHash, keyHash)
    )
  });

  if (!license) {
    return { valid: false, reason: 'not_found' };
  }

  if (license.status === 'revoked') {
    return { valid: false, reason: 'revoked' };
  }

  if (license.validUntil && license.validUntil < Date.now()) {
    return { valid: false, reason: 'expired' };
  }

  // Check activation limit
  const activations = await db.query.licenseActivations.findMany({
    where: and(
      eq(licenseActivations.licenseKeyId, license.id),
      eq(licenseActivations.isActive, true)
    )
  });

  const existingActivation = activations.find(a => a.instanceId === instanceId);

  if (!existingActivation && activations.length >= (license.maxActivations ?? 1)) {
    return { valid: false, reason: 'activation_limit' };
  }

  // Update or create activation
  await upsertActivation(license.id, instanceId);

  return {
    valid: true,
    tier: license.tier,
    features: JSON.parse(license.features),
    limits: {
      users: license.maxUsers,
      profiles: license.maxProfiles,
      servers: license.maxServers
    },
    expiresAt: license.validUntil
  };
}
```

### Generate License Key

```typescript
async function generateLicenseKey(params: {
  userId?: string;
  organizationId?: string;
  tier: string;
  validUntil?: Date;
}): Promise<{ key: string; license: LicenseKey }> {
  const tierConfig = await db.query.licenseTiers.findFirst({
    where: eq(licenseTiers.tier, params.tier)
  });

  // Generate key
  const keyPayload = {
    lid: crypto.randomUUID(),
    tier: params.tier,
    org: params.organizationId,
    lim: {
      users: tierConfig.maxUsers,
      profiles: tierConfig.maxProfiles,
      servers: tierConfig.maxServers
    },
    feat: JSON.parse(tierConfig.features),
    exp: params.validUntil?.getTime() ?? null,
    iat: Date.now()
  };

  const signature = sign(JSON.stringify(keyPayload), PRIVATE_KEY);
  const displayKey = formatAsDisplayKey(keyPayload, signature);
  const keyHash = sha256(displayKey);
  const keyPrefix = displayKey.slice(0, 8);

  // Store in database
  const license = await db.insert(licenseKeys).values({
    userId: params.userId,
    organizationId: params.organizationId,
    keyPrefix,
    keyHash,
    tier: params.tier,
    maxUsers: tierConfig.maxUsers,
    maxProfiles: tierConfig.maxProfiles,
    maxServers: tierConfig.maxServers,
    maxActivations: tierConfig.maxActivations,
    features: tierConfig.features,
    validFrom: Date.now(),
    validUntil: params.validUntil?.getTime()
  }).returning();

  return { key: displayKey, license: license[0] };
}
```

### Revoke License

```typescript
async function revokeLicense(
  licenseId: string,
  reason: string,
  revokedBy: string
): Promise<void> {
  await db.transaction(async (tx) => {
    // Update license status
    await tx.update(licenseKeys)
      .set({
        status: 'revoked',
        revocationReason: reason,
        revokedAt: Date.now(),
        revokedBy,
        updatedAt: Date.now()
      })
      .where(eq(licenseKeys.id, licenseId));

    // Deactivate all activations
    await tx.update(licenseActivations)
      .set({
        isActive: false,
        deactivatedAt: Date.now(),
        deactivationReason: 'License revoked',
        updatedAt: Date.now()
      })
      .where(eq(licenseActivations.licenseKeyId, licenseId));
  });
}
```

---

## See Also

- [Key Generation](../licensing/key-generation.md) - Key generation algorithm
- [Key Validation](../licensing/key-validation.md) - Validation flow
- [License API](../api/license-api.md) - API endpoints
