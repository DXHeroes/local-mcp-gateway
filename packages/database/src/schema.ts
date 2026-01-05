/**
 * Drizzle ORM schema definitions
 *
 * Database-agnostic schema using Drizzle ORM
 */

import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Profiles table
 */
export const profiles = sqliteTable(
  'profiles',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull().unique(),
    description: text('description'),
    createdAt: integer('created_at')
      .notNull()
      .$defaultFn(() => Date.now()),
    updatedAt: integer('updated_at')
      .notNull()
      .$defaultFn(() => Date.now()),
  },
  (table) => ({
    nameIdx: index('idx_profiles_name').on(table.name),
  })
);

/**
 * MCP servers table
 */
export const mcpServers = sqliteTable(
  'mcp_servers',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    type: text('type').notNull(), // 'external' | 'custom' | 'remote_http' | 'remote_sse'
    config: text('config', { mode: 'json' }).notNull(), // JSON config
    oauthConfig: text('oauth_config', { mode: 'json' }), // JSON OAuth config
    apiKeyConfig: text('api_key_config', { mode: 'json' }), // JSON API key config
    createdAt: integer('created_at')
      .notNull()
      .$defaultFn(() => Date.now()),
    updatedAt: integer('updated_at')
      .notNull()
      .$defaultFn(() => Date.now()),
  },
  (table) => ({
    typeIdx: index('idx_mcp_servers_type').on(table.type),
  })
);

/**
 * Profile-MCP server relationships
 */
export const profileMcpServers = sqliteTable(
  'profile_mcp_servers',
  {
    profileId: text('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    mcpServerId: text('mcp_server_id')
      .notNull()
      .references(() => mcpServers.id, { onDelete: 'cascade' }),
    order: integer('order').notNull().default(0),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    createdAt: integer('created_at')
      .notNull()
      .$defaultFn(() => Date.now()),
    updatedAt: integer('updated_at')
      .notNull()
      .$defaultFn(() => Date.now()),
  },
  (table) => ({
    pk: index('pk_profile_mcp_servers').on(table.profileId, table.mcpServerId),
    profileIdx: index('idx_profile_mcp_servers_profile').on(table.profileId),
    mcpServerIdx: index('idx_profile_mcp_servers_mcp').on(table.mcpServerId),
  })
);

/**
 * Profile-MCP server tool customizations
 * Stores per-profile customizations for tools from MCP servers
 */
export const profileMcpServerTools = sqliteTable(
  'profile_mcp_server_tools',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    profileId: text('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    mcpServerId: text('mcp_server_id')
      .notNull()
      .references(() => mcpServers.id, { onDelete: 'cascade' }),
    toolName: text('tool_name').notNull(),
    isEnabled: integer('is_enabled', { mode: 'boolean' }).notNull().default(true),
    customName: text('custom_name'),
    customDescription: text('custom_description'),
    customInputSchema: text('custom_input_schema', { mode: 'json' }),
    createdAt: integer('created_at')
      .notNull()
      .$defaultFn(() => Date.now()),
    updatedAt: integer('updated_at')
      .notNull()
      .$defaultFn(() => Date.now()),
  },
  (table) => ({
    uniqueProfileServerTool: index('idx_profile_mcp_server_tool_unique').on(
      table.profileId,
      table.mcpServerId,
      table.toolName
    ),
    profileIdx: index('idx_profile_mcp_server_tools_profile').on(table.profileId),
    mcpServerIdx: index('idx_profile_mcp_server_tools_server').on(table.mcpServerId),
  })
);

/**
 * MCP server tools cache
 * Caches remote tool metadata for change detection
 */
export const mcpServerToolsCache = sqliteTable(
  'mcp_server_tools_cache',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    mcpServerId: text('mcp_server_id')
      .notNull()
      .references(() => mcpServers.id, { onDelete: 'cascade' }),
    toolName: text('tool_name').notNull(),
    description: text('description'),
    inputSchema: text('input_schema', { mode: 'json' }),
    schemaHash: text('schema_hash').notNull(),
    fetchedAt: integer('fetched_at')
      .notNull()
      .$defaultFn(() => Date.now()),
    createdAt: integer('created_at')
      .notNull()
      .$defaultFn(() => Date.now()),
  },
  (table) => ({
    uniqueServerTool: index('idx_mcp_server_tools_cache_unique').on(
      table.mcpServerId,
      table.toolName
    ),
    mcpServerIdx: index('idx_mcp_server_tools_cache_server').on(table.mcpServerId),
  })
);

/**
 * OAuth tokens table
 */
export const oauthTokens = sqliteTable('oauth_tokens', {
  id: text('id').primaryKey(),
  mcpServerId: text('mcp_server_id')
    .notNull()
    .references(() => mcpServers.id, { onDelete: 'cascade' }),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token'),
  tokenType: text('token_type').notNull().default('Bearer'),
  expiresAt: integer('expires_at'),
  scope: text('scope'),
  createdAt: integer('created_at')
    .notNull()
    .$defaultFn(() => Date.now()),
  updatedAt: integer('updated_at')
    .notNull()
    .$defaultFn(() => Date.now()),
});

/**
 * OAuth client registrations table
 */
export const oauthClientRegistrations = sqliteTable(
  'oauth_client_registrations',
  {
    id: text('id').primaryKey(),
    mcpServerId: text('mcp_server_id')
      .notNull()
      .references(() => mcpServers.id, { onDelete: 'cascade' }),
    authorizationServerUrl: text('authorization_server_url').notNull(),
    clientId: text('client_id').notNull(),
    clientSecret: text('client_secret'),
    registrationAccessToken: text('registration_access_token'),
    createdAt: integer('created_at')
      .notNull()
      .$defaultFn(() => Date.now()),
    updatedAt: integer('updated_at')
      .notNull()
      .$defaultFn(() => Date.now()),
  },
  (table) => ({
    uniqueMcpServerAuthServer: index('idx_oauth_client_registrations_unique').on(
      table.mcpServerId,
      table.authorizationServerUrl
    ),
  })
);

/**
 * Debug logs table
 */
export const debugLogs = sqliteTable(
  'debug_logs',
  {
    id: text('id').primaryKey(),
    profileId: text('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    mcpServerId: text('mcp_server_id').references(() => mcpServers.id, { onDelete: 'set null' }),
    requestType: text('request_type').notNull(),
    requestPayload: text('request_payload').notNull(),
    responsePayload: text('response_payload'),
    status: text('status').notNull(), // 'pending' | 'success' | 'error'
    errorMessage: text('error_message'),
    durationMs: integer('duration_ms'),
    createdAt: integer('created_at')
      .notNull()
      .$defaultFn(() => Date.now()),
  },
  (table) => ({
    profileIdx: index('idx_debug_logs_profile').on(table.profileId),
    mcpServerIdx: index('idx_debug_logs_mcp_server').on(table.mcpServerId),
    createdAtIdx: index('idx_debug_logs_created_at').on(table.createdAt),
  })
);

/**
 * Users table
 */
export const users = sqliteTable(
  'users',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    email: text('email').notNull().unique(),
    password: text('password'), // Renamed from password_hash for better-auth compatibility
    name: text('name').notNull(),
    image: text('image'), // Renamed from avatar_url for better-auth compatibility
    emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
    status: text('status').notNull().default('active'), // 'active' | 'suspended'
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    emailIdx: index('idx_users_email').on(table.email),
  })
);

/**
 * Organizations table
 */
export const organizations = sqliteTable(
  'organizations',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    ownerId: text('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    plan: text('plan').notNull().default('free'), // 'free' | 'pro' | 'team' | 'enterprise'
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    slugIdx: index('idx_organizations_slug').on(table.slug),
    ownerIdx: index('idx_organizations_owner').on(table.ownerId),
  })
);

/**
 * Organization members table
 */
export const organizationMembers = sqliteTable(
  'organization_members',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    role: text('role').notNull().default('member'), // 'owner' | 'admin' | 'member'
    joinedAt: integer('joined_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    userIdx: index('idx_org_members_user').on(table.userId),
    orgIdx: index('idx_org_members_org').on(table.organizationId),
  })
);

/**
 * Subscriptions table (Cloud SaaS)
 */
export const subscriptions = sqliteTable(
  'subscriptions',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    organizationId: text('organization_id').references(() => organizations.id, {
      onDelete: 'set null',
    }),
    tier: text('tier').notNull(), // 'free' | 'pro' | 'team' | 'enterprise'
    status: text('status').notNull().default('active'), // 'active' | 'past_due' | 'canceled' | 'paused'
    billingCycle: text('billing_cycle'), // 'monthly' | 'annual'
    paddleSubscriptionId: text('paddle_subscription_id').unique(),
    paddleCustomerId: text('paddle_customer_id'),
    currentPeriodStart: integer('current_period_start', { mode: 'timestamp' }).notNull(),
    currentPeriodEnd: integer('current_period_end', { mode: 'timestamp' }).notNull(),
    cancelAtPeriodEnd: integer('cancel_at_period_end', { mode: 'boolean' })
      .notNull()
      .default(false),
    trialEnd: integer('trial_end', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    userIdx: index('idx_subscriptions_user').on(table.userId),
    orgIdx: index('idx_subscriptions_org').on(table.organizationId),
    paddleSubIdx: index('idx_subscriptions_paddle_sub').on(table.paddleSubscriptionId),
    statusIdx: index('idx_subscriptions_status').on(table.status),
  })
);

/**
 * Invoices table
 */
export const invoices = sqliteTable(
  'invoices',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    organizationId: text('organization_id').references(() => organizations.id, {
      onDelete: 'set null',
    }),
    subscriptionId: text('subscription_id').references(() => subscriptions.id, {
      onDelete: 'set null',
    }),
    amount: integer('amount').notNull(), // Amount in cents
    currency: text('currency').notNull().default('USD'),
    status: text('status').notNull(), // 'draft' | 'open' | 'paid' | 'void' | 'uncollectible'
    paddleInvoiceId: text('paddle_invoice_id').unique(),
    invoiceUrl: text('invoice_url'),
    dueDate: integer('due_date', { mode: 'timestamp' }),
    paidAt: integer('paid_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    orgIdx: index('idx_invoices_org').on(table.organizationId),
    subscriptionIdx: index('idx_invoices_subscription').on(table.subscriptionId),
    statusIdx: index('idx_invoices_status').on(table.status),
  })
);

/**
 * License keys table (Self-hosted)
 */
export const licenseKeys = sqliteTable(
  'license_keys',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    organizationId: text('organization_id').references(() => organizations.id, {
      onDelete: 'set null',
    }),
    keyPrefix: text('key_prefix').notNull(), // First 8 chars for lookup
    keyHash: text('key_hash').notNull().unique(), // SHA256 of full key
    tier: text('tier').notNull(), // 'startup' | 'business' | 'enterprise'
    maxUsers: integer('max_users'),
    maxProfiles: integer('max_profiles'),
    maxServers: integer('max_servers'),
    maxActivations: integer('max_activations').notNull().default(1),
    features: text('features', { mode: 'json' })
      .notNull()
      .$defaultFn(() => '[]'), // Array of feature codes
    validFrom: integer('valid_from', { mode: 'timestamp' }).notNull(),
    validUntil: integer('valid_until', { mode: 'timestamp' }),
    status: text('status').notNull().default('active'), // 'active' | 'revoked' | 'expired'
    notes: text('notes'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    keyHashIdx: index('idx_license_keys_hash').on(table.keyHash),
    userIdx: index('idx_license_keys_user').on(table.userId),
    orgIdx: index('idx_license_keys_org').on(table.organizationId),
    statusIdx: index('idx_license_keys_status').on(table.status),
  })
);

/**
 * License activations table
 */
export const licenseActivations = sqliteTable(
  'license_activations',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    licenseKeyId: text('license_key_id')
      .notNull()
      .references(() => licenseKeys.id, { onDelete: 'cascade' }),
    instanceId: text('instance_id').notNull(),
    instanceName: text('instance_name'),
    hostname: text('hostname'),
    osType: text('os_type'),
    osVersion: text('os_version'),
    appVersion: text('app_version'),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    firstActivated: integer('first_activated', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    lastSeen: integer('last_seen', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    licenseIdx: index('idx_license_activations_license').on(table.licenseKeyId),
    instanceIdx: index('idx_license_activations_instance').on(table.instanceId),
  })
);

/**
 * Usage records table
 */
export const usageRecords = sqliteTable(
  'usage_records',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    organizationId: text('organization_id').references(() => organizations.id, {
      onDelete: 'cascade',
    }),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    date: integer('date', { mode: 'timestamp' }).notNull(), // Day timestamp
    profilesCount: integer('profiles_count').notNull().default(0),
    serversCount: integer('servers_count').notNull().default(0),
    requestsCount: integer('requests_count').notNull().default(0),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    orgIdx: index('idx_usage_records_org').on(table.organizationId),
    dateIdx: index('idx_usage_records_date').on(table.date),
    orgDateIdx: index('idx_usage_records_org_date').on(table.organizationId, table.date),
  })
);

/**
 * Paddle events table (Webhook events)
 */
export const paddleEvents = sqliteTable(
  'paddle_events',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    eventId: text('event_id').notNull().unique(), // Paddle event ID
    eventType: text('event_type').notNull(), // e.g., 'subscription.created'
    payload: text('payload', { mode: 'json' }).notNull(), // Full event payload
    processed: integer('processed', { mode: 'boolean' }).notNull().default(false),
    processedAt: integer('processed_at', { mode: 'timestamp' }),
    error: text('error'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    eventIdIdx: index('idx_paddle_events_event_id').on(table.eventId),
    eventTypeIdx: index('idx_paddle_events_type').on(table.eventType),
    processedIdx: index('idx_paddle_events_processed').on(table.processed),
  })
);

/**
 * Migrations tracking table
 */
export const migrations = sqliteTable('migrations', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  executedAt: integer('executed_at')
    .notNull()
    .$defaultFn(() => Date.now()),
});

/**
 * Better Auth tables
 */
export const session = sqliteTable(
  'session',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: integer('expires_at').notNull(),
    token: text('token').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: integer('created_at')
      .notNull()
      .$defaultFn(() => Date.now()),
    updatedAt: integer('updated_at')
      .notNull()
      .$defaultFn(() => Date.now()),
  },
  (table) => ({
    userIdx: index('idx_session_user').on(table.userId),
    expiresIdx: index('idx_session_expires').on(table.expiresAt),
  })
);

export const account = sqliteTable(
  'account',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accountId: text('account_id').notNull(),
    provider: text('provider').notNull(),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    expiresAt: integer('expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: integer('created_at')
      .notNull()
      .$defaultFn(() => Date.now()),
    updatedAt: integer('updated_at')
      .notNull()
      .$defaultFn(() => Date.now()),
  },
  (table) => ({
    userIdx: index('idx_account_user').on(table.userId),
    providerIdx: index('idx_account_provider').on(table.provider),
    providerAccountUnique: index('idx_account_provider_account').on(
      table.provider,
      table.accountId
    ),
  })
);

export const verification = sqliteTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: integer('expires_at').notNull(),
    createdAt: integer('created_at')
      .notNull()
      .$defaultFn(() => Date.now()),
    updatedAt: integer('updated_at')
      .notNull()
      .$defaultFn(() => Date.now()),
  },
  (table) => ({
    identifierIdx: index('idx_verification_identifier').on(table.identifier),
    valueIdx: index('idx_verification_value').on(table.value),
  })
);

export const twoFactor = sqliteTable(
  'two_factor',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    secret: text('secret').notNull(),
    backupCodes: text('backup_codes'),
    createdAt: integer('created_at')
      .notNull()
      .$defaultFn(() => Date.now()),
    updatedAt: integer('updated_at')
      .notNull()
      .$defaultFn(() => Date.now()),
  },
  (table) => ({
    userIdx: index('idx_two_factor_user').on(table.userId),
  })
);

// Type exports for use in repositories
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type McpServer = typeof mcpServers.$inferSelect;
export type NewMcpServer = typeof mcpServers.$inferInsert;
export type ProfileMcpServer = typeof profileMcpServers.$inferSelect;
export type NewProfileMcpServer = typeof profileMcpServers.$inferInsert;
export type OAuthToken = typeof oauthTokens.$inferSelect;
export type NewOAuthToken = typeof oauthTokens.$inferInsert;
export type OAuthClientRegistration = typeof oauthClientRegistrations.$inferSelect;
export type NewOAuthClientRegistration = typeof oauthClientRegistrations.$inferInsert;
export type DebugLog = typeof debugLogs.$inferSelect;
export type NewDebugLog = typeof debugLogs.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type NewOrganizationMember = typeof organizationMembers.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
export type LicenseKey = typeof licenseKeys.$inferSelect;
export type NewLicenseKey = typeof licenseKeys.$inferInsert;
export type LicenseActivation = typeof licenseActivations.$inferSelect;
export type NewLicenseActivation = typeof licenseActivations.$inferInsert;
export type UsageRecord = typeof usageRecords.$inferSelect;
export type NewUsageRecord = typeof usageRecords.$inferInsert;
export type PaddleEvent = typeof paddleEvents.$inferSelect;
export type NewPaddleEvent = typeof paddleEvents.$inferInsert;
export type Migration = typeof migrations.$inferSelect;
export type NewMigration = typeof migrations.$inferInsert;
export type ProfileMcpServerTool = typeof profileMcpServerTools.$inferSelect;
export type NewProfileMcpServerTool = typeof profileMcpServerTools.$inferInsert;
export type McpServerToolsCache = typeof mcpServerToolsCache.$inferSelect;
export type NewMcpServerToolsCache = typeof mcpServerToolsCache.$inferInsert;
