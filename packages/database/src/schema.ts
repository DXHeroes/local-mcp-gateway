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
  },
  (table) => ({
    pk: index('pk_profile_mcp_servers').on(table.profileId, table.mcpServerId),
    profileIdx: index('idx_profile_mcp_servers_profile').on(table.profileId),
    mcpServerIdx: index('idx_profile_mcp_servers_mcp').on(table.mcpServerId),
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
 * Migrations tracking table
 */
export const migrations = sqliteTable('migrations', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  executedAt: integer('executed_at')
    .notNull()
    .$defaultFn(() => Date.now()),
});

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
export type Migration = typeof migrations.$inferSelect;
export type NewMigration = typeof migrations.$inferInsert;
