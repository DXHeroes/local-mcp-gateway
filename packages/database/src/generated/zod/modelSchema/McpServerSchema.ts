import { z } from 'zod';
import { ProfileMcpServerWithRelationsSchema, ProfileMcpServerOptionalDefaultsWithRelationsSchema } from './ProfileMcpServerSchema'
import type { ProfileMcpServerWithRelations, ProfileMcpServerOptionalDefaultsWithRelations } from './ProfileMcpServerSchema'
import { OAuthTokenWithRelationsSchema, OAuthTokenOptionalDefaultsWithRelationsSchema } from './OAuthTokenSchema'
import type { OAuthTokenWithRelations, OAuthTokenOptionalDefaultsWithRelations } from './OAuthTokenSchema'
import { OAuthClientRegistrationWithRelationsSchema, OAuthClientRegistrationOptionalDefaultsWithRelationsSchema } from './OAuthClientRegistrationSchema'
import type { OAuthClientRegistrationWithRelations, OAuthClientRegistrationOptionalDefaultsWithRelations } from './OAuthClientRegistrationSchema'
import { McpServerToolsCacheWithRelationsSchema, McpServerToolsCacheOptionalDefaultsWithRelationsSchema } from './McpServerToolsCacheSchema'
import type { McpServerToolsCacheWithRelations, McpServerToolsCacheOptionalDefaultsWithRelations } from './McpServerToolsCacheSchema'
import { DebugLogWithRelationsSchema, DebugLogOptionalDefaultsWithRelationsSchema } from './DebugLogSchema'
import type { DebugLogWithRelations, DebugLogOptionalDefaultsWithRelations } from './DebugLogSchema'

/////////////////////////////////////////
// MCP SERVER SCHEMA
/////////////////////////////////////////

/**
 * MCP server configurations
 */
export const McpServerSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  type: z.string(),
  config: z.string(),
  oauthConfig: z.string().nullable(),
  apiKeyConfig: z.string().nullable(),
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
  profiles: ProfileMcpServerWithRelations[];
  oauthToken?: OAuthTokenWithRelations | null;
  oauthClientRegistrations: OAuthClientRegistrationWithRelations[];
  toolsCache: McpServerToolsCacheWithRelations[];
  debugLogs: DebugLogWithRelations[];
};

export type McpServerWithRelations = z.infer<typeof McpServerSchema> & McpServerRelations

export const McpServerWithRelationsSchema: z.ZodType<McpServerWithRelations> = McpServerSchema.merge(z.object({
  profiles: z.lazy(() => ProfileMcpServerWithRelationsSchema).array(),
  oauthToken: z.lazy(() => OAuthTokenWithRelationsSchema).nullable(),
  oauthClientRegistrations: z.lazy(() => OAuthClientRegistrationWithRelationsSchema).array(),
  toolsCache: z.lazy(() => McpServerToolsCacheWithRelationsSchema).array(),
  debugLogs: z.lazy(() => DebugLogWithRelationsSchema).array(),
}))

/////////////////////////////////////////
// MCP SERVER OPTIONAL DEFAULTS RELATION SCHEMA
/////////////////////////////////////////

export type McpServerOptionalDefaultsRelations = {
  profiles: ProfileMcpServerOptionalDefaultsWithRelations[];
  oauthToken?: OAuthTokenOptionalDefaultsWithRelations | null;
  oauthClientRegistrations: OAuthClientRegistrationOptionalDefaultsWithRelations[];
  toolsCache: McpServerToolsCacheOptionalDefaultsWithRelations[];
  debugLogs: DebugLogOptionalDefaultsWithRelations[];
};

export type McpServerOptionalDefaultsWithRelations = z.infer<typeof McpServerOptionalDefaultsSchema> & McpServerOptionalDefaultsRelations

export const McpServerOptionalDefaultsWithRelationsSchema: z.ZodType<McpServerOptionalDefaultsWithRelations> = McpServerOptionalDefaultsSchema.merge(z.object({
  profiles: z.lazy(() => ProfileMcpServerOptionalDefaultsWithRelationsSchema).array(),
  oauthToken: z.lazy(() => OAuthTokenOptionalDefaultsWithRelationsSchema).nullable(),
  oauthClientRegistrations: z.lazy(() => OAuthClientRegistrationOptionalDefaultsWithRelationsSchema).array(),
  toolsCache: z.lazy(() => McpServerToolsCacheOptionalDefaultsWithRelationsSchema).array(),
  debugLogs: z.lazy(() => DebugLogOptionalDefaultsWithRelationsSchema).array(),
}))

export default McpServerSchema;
