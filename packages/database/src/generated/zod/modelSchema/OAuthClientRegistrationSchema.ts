import { z } from 'zod';
import { McpServerWithRelationsSchema, McpServerOptionalDefaultsWithRelationsSchema } from './McpServerSchema'
import type { McpServerWithRelations, McpServerOptionalDefaultsWithRelations } from './McpServerSchema'

/////////////////////////////////////////
// O AUTH CLIENT REGISTRATION SCHEMA
/////////////////////////////////////////

/**
 * Dynamic client registrations for OAuth (RFC 7591)
 */
export const OAuthClientRegistrationSchema = z.object({
  id: z.uuid(),
  mcpServerId: z.string(),
  authorizationServerUrl: z.string(),
  clientId: z.string(),
  clientSecret: z.string().nullable(),
  registrationAccessToken: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type OAuthClientRegistration = z.infer<typeof OAuthClientRegistrationSchema>

/////////////////////////////////////////
// O AUTH CLIENT REGISTRATION OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const OAuthClientRegistrationOptionalDefaultsSchema = OAuthClientRegistrationSchema.merge(z.object({
  id: z.uuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type OAuthClientRegistrationOptionalDefaults = z.infer<typeof OAuthClientRegistrationOptionalDefaultsSchema>

/////////////////////////////////////////
// O AUTH CLIENT REGISTRATION RELATION SCHEMA
/////////////////////////////////////////

export type OAuthClientRegistrationRelations = {
  mcpServer: McpServerWithRelations;
};

export type OAuthClientRegistrationWithRelations = z.infer<typeof OAuthClientRegistrationSchema> & OAuthClientRegistrationRelations

export const OAuthClientRegistrationWithRelationsSchema: z.ZodType<OAuthClientRegistrationWithRelations> = OAuthClientRegistrationSchema.merge(z.object({
  mcpServer: z.lazy(() => McpServerWithRelationsSchema),
}))

/////////////////////////////////////////
// O AUTH CLIENT REGISTRATION OPTIONAL DEFAULTS RELATION SCHEMA
/////////////////////////////////////////

export type OAuthClientRegistrationOptionalDefaultsRelations = {
  mcpServer: McpServerOptionalDefaultsWithRelations;
};

export type OAuthClientRegistrationOptionalDefaultsWithRelations = z.infer<typeof OAuthClientRegistrationOptionalDefaultsSchema> & OAuthClientRegistrationOptionalDefaultsRelations

export const OAuthClientRegistrationOptionalDefaultsWithRelationsSchema: z.ZodType<OAuthClientRegistrationOptionalDefaultsWithRelations> = OAuthClientRegistrationOptionalDefaultsSchema.merge(z.object({
  mcpServer: z.lazy(() => McpServerOptionalDefaultsWithRelationsSchema),
}))

export default OAuthClientRegistrationSchema;
