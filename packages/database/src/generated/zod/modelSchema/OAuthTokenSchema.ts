import { z } from 'zod';
import { McpServerWithRelationsSchema, McpServerOptionalDefaultsWithRelationsSchema } from './McpServerSchema'
import type { McpServerWithRelations, McpServerOptionalDefaultsWithRelations } from './McpServerSchema'

/////////////////////////////////////////
// O AUTH TOKEN SCHEMA
/////////////////////////////////////////

/**
 * OAuth tokens for MCP servers
 */
export const OAuthTokenSchema = z.object({
  id: z.uuid(),
  mcpServerId: z.string(),
  accessToken: z.string(),
  refreshToken: z.string().nullable(),
  tokenType: z.string(),
  scope: z.string().nullable(),
  expiresAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type OAuthToken = z.infer<typeof OAuthTokenSchema>

/////////////////////////////////////////
// O AUTH TOKEN OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const OAuthTokenOptionalDefaultsSchema = OAuthTokenSchema.merge(z.object({
  id: z.uuid().optional(),
  tokenType: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type OAuthTokenOptionalDefaults = z.infer<typeof OAuthTokenOptionalDefaultsSchema>

/////////////////////////////////////////
// O AUTH TOKEN RELATION SCHEMA
/////////////////////////////////////////

export type OAuthTokenRelations = {
  mcpServer: McpServerWithRelations;
};

export type OAuthTokenWithRelations = z.infer<typeof OAuthTokenSchema> & OAuthTokenRelations

export const OAuthTokenWithRelationsSchema: z.ZodType<OAuthTokenWithRelations> = OAuthTokenSchema.merge(z.object({
  mcpServer: z.lazy(() => McpServerWithRelationsSchema),
}))

/////////////////////////////////////////
// O AUTH TOKEN OPTIONAL DEFAULTS RELATION SCHEMA
/////////////////////////////////////////

export type OAuthTokenOptionalDefaultsRelations = {
  mcpServer: McpServerOptionalDefaultsWithRelations;
};

export type OAuthTokenOptionalDefaultsWithRelations = z.infer<typeof OAuthTokenOptionalDefaultsSchema> & OAuthTokenOptionalDefaultsRelations

export const OAuthTokenOptionalDefaultsWithRelationsSchema: z.ZodType<OAuthTokenOptionalDefaultsWithRelations> = OAuthTokenOptionalDefaultsSchema.merge(z.object({
  mcpServer: z.lazy(() => McpServerOptionalDefaultsWithRelationsSchema),
}))

export default OAuthTokenSchema;
