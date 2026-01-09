import { z } from 'zod';
import { ProfileMcpServerWithRelationsSchema, ProfileMcpServerOptionalDefaultsWithRelationsSchema } from './ProfileMcpServerSchema'
import type { ProfileMcpServerWithRelations, ProfileMcpServerOptionalDefaultsWithRelations } from './ProfileMcpServerSchema'
import { DebugLogWithRelationsSchema, DebugLogOptionalDefaultsWithRelationsSchema } from './DebugLogSchema'
import type { DebugLogWithRelations, DebugLogOptionalDefaultsWithRelations } from './DebugLogSchema'

/////////////////////////////////////////
// PROFILE SCHEMA
/////////////////////////////////////////

/**
 * User-defined profiles for grouping MCP servers
 */
export const ProfileSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Profile = z.infer<typeof ProfileSchema>

/////////////////////////////////////////
// PROFILE OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const ProfileOptionalDefaultsSchema = ProfileSchema.merge(z.object({
  id: z.uuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type ProfileOptionalDefaults = z.infer<typeof ProfileOptionalDefaultsSchema>

/////////////////////////////////////////
// PROFILE RELATION SCHEMA
/////////////////////////////////////////

export type ProfileRelations = {
  mcpServers: ProfileMcpServerWithRelations[];
  debugLogs: DebugLogWithRelations[];
};

export type ProfileWithRelations = z.infer<typeof ProfileSchema> & ProfileRelations

export const ProfileWithRelationsSchema: z.ZodType<ProfileWithRelations> = ProfileSchema.merge(z.object({
  mcpServers: z.lazy(() => ProfileMcpServerWithRelationsSchema).array(),
  debugLogs: z.lazy(() => DebugLogWithRelationsSchema).array(),
}))

/////////////////////////////////////////
// PROFILE OPTIONAL DEFAULTS RELATION SCHEMA
/////////////////////////////////////////

export type ProfileOptionalDefaultsRelations = {
  mcpServers: ProfileMcpServerOptionalDefaultsWithRelations[];
  debugLogs: DebugLogOptionalDefaultsWithRelations[];
};

export type ProfileOptionalDefaultsWithRelations = z.infer<typeof ProfileOptionalDefaultsSchema> & ProfileOptionalDefaultsRelations

export const ProfileOptionalDefaultsWithRelationsSchema: z.ZodType<ProfileOptionalDefaultsWithRelations> = ProfileOptionalDefaultsSchema.merge(z.object({
  mcpServers: z.lazy(() => ProfileMcpServerOptionalDefaultsWithRelationsSchema).array(),
  debugLogs: z.lazy(() => DebugLogOptionalDefaultsWithRelationsSchema).array(),
}))

export default ProfileSchema;
