import { z } from 'zod';
import { ProfileWithRelationsSchema, ProfileOptionalDefaultsWithRelationsSchema } from './ProfileSchema'
import type { ProfileWithRelations, ProfileOptionalDefaultsWithRelations } from './ProfileSchema'
import { McpServerWithRelationsSchema, McpServerOptionalDefaultsWithRelationsSchema } from './McpServerSchema'
import type { McpServerWithRelations, McpServerOptionalDefaultsWithRelations } from './McpServerSchema'

/////////////////////////////////////////
// DEBUG LOG SCHEMA
/////////////////////////////////////////

/**
 * Debug logs for MCP requests/responses
 */
export const DebugLogSchema = z.object({
  id: z.uuid(),
  profileId: z.string(),
  mcpServerId: z.string().nullable(),
  requestType: z.string(),
  requestPayload: z.string(),
  responsePayload: z.string().nullable(),
  status: z.string(),
  errorMessage: z.string().nullable(),
  durationMs: z.number().int().nullable(),
  createdAt: z.coerce.date(),
})

export type DebugLog = z.infer<typeof DebugLogSchema>

/////////////////////////////////////////
// DEBUG LOG OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const DebugLogOptionalDefaultsSchema = DebugLogSchema.merge(z.object({
  id: z.uuid().optional(),
  createdAt: z.coerce.date().optional(),
}))

export type DebugLogOptionalDefaults = z.infer<typeof DebugLogOptionalDefaultsSchema>

/////////////////////////////////////////
// DEBUG LOG RELATION SCHEMA
/////////////////////////////////////////

export type DebugLogRelations = {
  profile: ProfileWithRelations;
  mcpServer?: McpServerWithRelations | null;
};

export type DebugLogWithRelations = z.infer<typeof DebugLogSchema> & DebugLogRelations

export const DebugLogWithRelationsSchema: z.ZodType<DebugLogWithRelations> = DebugLogSchema.merge(z.object({
  profile: z.lazy(() => ProfileWithRelationsSchema),
  mcpServer: z.lazy(() => McpServerWithRelationsSchema).nullable(),
}))

/////////////////////////////////////////
// DEBUG LOG OPTIONAL DEFAULTS RELATION SCHEMA
/////////////////////////////////////////

export type DebugLogOptionalDefaultsRelations = {
  profile: ProfileOptionalDefaultsWithRelations;
  mcpServer?: McpServerOptionalDefaultsWithRelations | null;
};

export type DebugLogOptionalDefaultsWithRelations = z.infer<typeof DebugLogOptionalDefaultsSchema> & DebugLogOptionalDefaultsRelations

export const DebugLogOptionalDefaultsWithRelationsSchema: z.ZodType<DebugLogOptionalDefaultsWithRelations> = DebugLogOptionalDefaultsSchema.merge(z.object({
  profile: z.lazy(() => ProfileOptionalDefaultsWithRelationsSchema),
  mcpServer: z.lazy(() => McpServerOptionalDefaultsWithRelationsSchema).nullable(),
}))

export default DebugLogSchema;
