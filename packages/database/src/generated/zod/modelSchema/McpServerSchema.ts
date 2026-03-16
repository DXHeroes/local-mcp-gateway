import { z } from 'zod';
import { UserWithRelationsSchema, UserOptionalDefaultsWithRelationsSchema } from './UserSchema'
import type { UserWithRelations, UserOptionalDefaultsWithRelations } from './UserSchema'
import { ProfileMcpServerWithRelationsSchema, ProfileMcpServerOptionalDefaultsWithRelationsSchema } from './ProfileMcpServerSchema'
import type { ProfileMcpServerWithRelations, ProfileMcpServerOptionalDefaultsWithRelations } from './ProfileMcpServerSchema'
import { OAuthTokenWithRelationsSchema, OAuthTokenOptionalDefaultsWithRelationsSchema } from './OAuthTokenSchema'
import type { OAuthTokenWithRelations, OAuthTokenOptionalDefaultsWithRelations } from './OAuthTokenSchema'
import { OAuthClientRegistrationWithRelationsSchema, OAuthClientRegistrationOptionalDefaultsWithRelationsSchema } from './OAuthClientRegistrationSchema'
import type { OAuthClientRegistrationWithRelations, OAuthClientRegistrationOptionalDefaultsWithRelations } from './OAuthClientRegistrationSchema'
import { McpServerToolsCacheWithRelationsSchema, McpServerToolsCacheOptionalDefaultsWithRelationsSchema } from './McpServerToolsCacheSchema'
import type { McpServerToolsCacheWithRelations, McpServerToolsCacheOptionalDefaultsWithRelations } from './McpServerToolsCacheSchema'
import { McpServerToolConfigWithRelationsSchema, McpServerToolConfigOptionalDefaultsWithRelationsSchema } from './McpServerToolConfigSchema'
import type { McpServerToolConfigWithRelations, McpServerToolConfigOptionalDefaultsWithRelations } from './McpServerToolConfigSchema'
import { DebugLogWithRelationsSchema, DebugLogOptionalDefaultsWithRelationsSchema } from './DebugLogSchema'
import type { DebugLogWithRelations, DebugLogOptionalDefaultsWithRelations } from './DebugLogSchema'

/////////////////////////////////////////
// MCP SERVER SCHEMA
/////////////////////////////////////////

/**
 * MCP server configurations — owned by individual users (per-user, not per-org)
 */
export const McpServerSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  type: z.string(),
  config: z.string(),
  oauthConfig: z.string().nullable(),
  apiKeyConfig: z.string().nullable(),
  userId: z.string(),
  presetId: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type McpServer = z.infer<typeof McpServerSchema>

/////////////////////////////////////////
// MCP SERVER OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const McpServerOptionalDefaultsSchema = McpServerSchema.merge(z.object({
  id: z.uuid().optional(),
  config: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type McpServerOptionalDefaults = z.infer<typeof McpServerOptionalDefaultsSchema>

/////////////////////////////////////////
// MCP SERVER RELATION SCHEMA
/////////////////////////////////////////

export type McpServerRelations = {
  user: UserWithRelations;
  profiles: ProfileMcpServerWithRelations[];
  oauthToken?: OAuthTokenWithRelations | null;
  oauthClientRegistrations: OAuthClientRegistrationWithRelations[];
  toolsCache: McpServerToolsCacheWithRelations[];
  toolConfigs: McpServerToolConfigWithRelations[];
  debugLogs: DebugLogWithRelations[];
};

export type McpServerWithRelations = z.infer<typeof McpServerSchema> & McpServerRelations

export const McpServerWithRelationsSchema: z.ZodType<McpServerWithRelations> = McpServerSchema.merge(z.object({
  user: z.lazy(() => UserWithRelationsSchema),
  profiles: z.lazy(() => ProfileMcpServerWithRelationsSchema).array(),
  oauthToken: z.lazy(() => OAuthTokenWithRelationsSchema).nullable(),
  oauthClientRegistrations: z.lazy(() => OAuthClientRegistrationWithRelationsSchema).array(),
  toolsCache: z.lazy(() => McpServerToolsCacheWithRelationsSchema).array(),
  toolConfigs: z.lazy(() => McpServerToolConfigWithRelationsSchema).array(),
  debugLogs: z.lazy(() => DebugLogWithRelationsSchema).array(),
}))

/////////////////////////////////////////
// MCP SERVER OPTIONAL DEFAULTS RELATION SCHEMA
/////////////////////////////////////////

export type McpServerOptionalDefaultsRelations = {
  user: UserOptionalDefaultsWithRelations;
  profiles: ProfileMcpServerOptionalDefaultsWithRelations[];
  oauthToken?: OAuthTokenOptionalDefaultsWithRelations | null;
  oauthClientRegistrations: OAuthClientRegistrationOptionalDefaultsWithRelations[];
  toolsCache: McpServerToolsCacheOptionalDefaultsWithRelations[];
  toolConfigs: McpServerToolConfigOptionalDefaultsWithRelations[];
  debugLogs: DebugLogOptionalDefaultsWithRelations[];
};

export type McpServerOptionalDefaultsWithRelations = z.infer<typeof McpServerOptionalDefaultsSchema> & McpServerOptionalDefaultsRelations

export const McpServerOptionalDefaultsWithRelationsSchema: z.ZodType<McpServerOptionalDefaultsWithRelations> = McpServerOptionalDefaultsSchema.merge(z.object({
  user: z.lazy(() => UserOptionalDefaultsWithRelationsSchema),
  profiles: z.lazy(() => ProfileMcpServerOptionalDefaultsWithRelationsSchema).array(),
  oauthToken: z.lazy(() => OAuthTokenOptionalDefaultsWithRelationsSchema).nullable(),
  oauthClientRegistrations: z.lazy(() => OAuthClientRegistrationOptionalDefaultsWithRelationsSchema).array(),
  toolsCache: z.lazy(() => McpServerToolsCacheOptionalDefaultsWithRelationsSchema).array(),
  toolConfigs: z.lazy(() => McpServerToolConfigOptionalDefaultsWithRelationsSchema).array(),
  debugLogs: z.lazy(() => DebugLogOptionalDefaultsWithRelationsSchema).array(),
}))

export default McpServerSchema;
