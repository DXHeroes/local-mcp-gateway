/**
 * Monetization system migration
 * Adds tables for users, organizations, subscriptions, licenses, and usage tracking
 */

import type { Database as DatabaseType } from 'better-sqlite3';

export function up(db: DatabaseType): void {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT,
      name TEXT NOT NULL,
      avatar_url TEXT,
      email_verified INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // Organizations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plan TEXT NOT NULL DEFAULT 'free',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // Organization members table
  db.exec(`
    CREATE TABLE IF NOT EXISTS organization_members (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'member',
      joined_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, organization_id)
    )
  `);

  // Subscriptions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      organization_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
      tier TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      billing_cycle TEXT,
      paddle_subscription_id TEXT UNIQUE,
      paddle_customer_id TEXT,
      current_period_start INTEGER NOT NULL,
      current_period_end INTEGER NOT NULL,
      cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
      trial_end INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // Invoices table
  db.exec(`
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      organization_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
      subscription_id TEXT REFERENCES subscriptions(id) ON DELETE SET NULL,
      amount INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      status TEXT NOT NULL,
      paddle_invoice_id TEXT UNIQUE,
      invoice_url TEXT,
      due_date INTEGER,
      paid_at INTEGER,
      created_at INTEGER NOT NULL
    )
  `);

  // License keys table
  db.exec(`
    CREATE TABLE IF NOT EXISTS license_keys (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      organization_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
      key_prefix TEXT NOT NULL,
      key_hash TEXT NOT NULL UNIQUE,
      tier TEXT NOT NULL,
      max_users INTEGER,
      max_profiles INTEGER,
      max_servers INTEGER,
      max_activations INTEGER NOT NULL DEFAULT 1,
      features TEXT NOT NULL DEFAULT '[]',
      valid_from INTEGER NOT NULL,
      valid_until INTEGER,
      status TEXT NOT NULL DEFAULT 'active',
      notes TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // License activations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS license_activations (
      id TEXT PRIMARY KEY,
      license_key_id TEXT NOT NULL REFERENCES license_keys(id) ON DELETE CASCADE,
      instance_id TEXT NOT NULL,
      instance_name TEXT,
      hostname TEXT,
      os_type TEXT,
      os_version TEXT,
      app_version TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      first_activated INTEGER NOT NULL,
      last_seen INTEGER NOT NULL
    )
  `);

  // Usage records table
  db.exec(`
    CREATE TABLE IF NOT EXISTS usage_records (
      id TEXT PRIMARY KEY,
      organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      date INTEGER NOT NULL,
      profiles_count INTEGER NOT NULL DEFAULT 0,
      servers_count INTEGER NOT NULL DEFAULT 0,
      requests_count INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    )
  `);

  // Paddle events table
  db.exec(`
    CREATE TABLE IF NOT EXISTS paddle_events (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL UNIQUE,
      event_type TEXT NOT NULL,
      payload TEXT NOT NULL,
      processed INTEGER NOT NULL DEFAULT 0,
      processed_at INTEGER,
      error TEXT,
      created_at INTEGER NOT NULL
    )
  `);

  // Indexes for users
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `);

  // Indexes for organizations
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
    CREATE INDEX IF NOT EXISTS idx_organizations_owner ON organizations(owner_id);
  `);

  // Indexes for organization_members
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
    CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(organization_id);
  `);

  // Indexes for subscriptions
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_org ON subscriptions(organization_id);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_paddle_sub ON subscriptions(paddle_subscription_id);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
  `);

  // Indexes for invoices
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(organization_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_subscription ON invoices(subscription_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
  `);

  // Indexes for license_keys
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_license_keys_hash ON license_keys(key_hash);
    CREATE INDEX IF NOT EXISTS idx_license_keys_user ON license_keys(user_id);
    CREATE INDEX IF NOT EXISTS idx_license_keys_org ON license_keys(organization_id);
    CREATE INDEX IF NOT EXISTS idx_license_keys_status ON license_keys(status);
  `);

  // Indexes for license_activations
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_license_activations_license ON license_activations(license_key_id);
    CREATE INDEX IF NOT EXISTS idx_license_activations_instance ON license_activations(instance_id);
  `);

  // Indexes for usage_records
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_usage_records_org ON usage_records(organization_id);
    CREATE INDEX IF NOT EXISTS idx_usage_records_date ON usage_records(date);
    CREATE INDEX IF NOT EXISTS idx_usage_records_org_date ON usage_records(organization_id, date);
  `);

  // Indexes for paddle_events
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_paddle_events_event_id ON paddle_events(event_id);
    CREATE INDEX IF NOT EXISTS idx_paddle_events_type ON paddle_events(event_type);
    CREATE INDEX IF NOT EXISTS idx_paddle_events_processed ON paddle_events(processed);
  `);
}

export function down(db: DatabaseType): void {
  // Drop indexes
  db.exec(`
    DROP INDEX IF EXISTS idx_paddle_events_processed;
    DROP INDEX IF EXISTS idx_paddle_events_type;
    DROP INDEX IF EXISTS idx_paddle_events_event_id;
    DROP INDEX IF EXISTS idx_usage_records_org_date;
    DROP INDEX IF EXISTS idx_usage_records_date;
    DROP INDEX IF EXISTS idx_usage_records_org;
    DROP INDEX IF EXISTS idx_license_activations_instance;
    DROP INDEX IF EXISTS idx_license_activations_license;
    DROP INDEX IF EXISTS idx_license_keys_status;
    DROP INDEX IF EXISTS idx_license_keys_org;
    DROP INDEX IF EXISTS idx_license_keys_user;
    DROP INDEX IF EXISTS idx_license_keys_hash;
    DROP INDEX IF EXISTS idx_invoices_status;
    DROP INDEX IF EXISTS idx_invoices_subscription;
    DROP INDEX IF EXISTS idx_invoices_org;
    DROP INDEX IF EXISTS idx_subscriptions_status;
    DROP INDEX IF EXISTS idx_subscriptions_paddle_sub;
    DROP INDEX IF EXISTS idx_subscriptions_org;
    DROP INDEX IF EXISTS idx_subscriptions_user;
    DROP INDEX IF EXISTS idx_org_members_org;
    DROP INDEX IF EXISTS idx_org_members_user;
    DROP INDEX IF EXISTS idx_organizations_owner;
    DROP INDEX IF EXISTS idx_organizations_slug;
    DROP INDEX IF EXISTS idx_users_email;
  `);

  // Drop tables (reverse order due to foreign keys)
  db.exec(`
    DROP TABLE IF EXISTS paddle_events;
    DROP TABLE IF EXISTS usage_records;
    DROP TABLE IF EXISTS license_activations;
    DROP TABLE IF EXISTS license_keys;
    DROP TABLE IF EXISTS invoices;
    DROP TABLE IF EXISTS subscriptions;
    DROP TABLE IF EXISTS organization_members;
    DROP TABLE IF EXISTS organizations;
    DROP TABLE IF EXISTS users;
  `);
}
