import { z } from 'zod';
import { UserWithRelationsSchema, UserOptionalDefaultsWithRelationsSchema } from './UserSchema'
import type { UserWithRelations, UserOptionalDefaultsWithRelations } from './UserSchema'
import { OrganizationWithRelationsSchema, OrganizationOptionalDefaultsWithRelationsSchema } from './OrganizationSchema'
import type { OrganizationWithRelations, OrganizationOptionalDefaultsWithRelations } from './OrganizationSchema'
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
  userId: z.string(),
  organizationId: z.string(),
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
  user: UserWithRelations;
  organization: OrganizationWithRelations;
  mcpServers: ProfileMcpServerWithRelations[];
  debugLogs: DebugLogWithRelations[];
};

export type ProfileWithRelations = z.infer<typeof ProfileSchema> & ProfileRelations

export const ProfileWithRelationsSchema: z.ZodType<ProfileWithRelations> = ProfileSchema.merge(z.object({
  user: z.lazy(() => UserWithRelationsSchema),
  organization: z.lazy(() => OrganizationWithRelationsSchema),
  mcpServers: z.lazy(() => ProfileMcpServerWithRelationsSchema).array(),
  debugLogs: z.lazy(() => DebugLogWithRelationsSchema).array(),
}))

/////////////////////////////////////////
// PROFILE OPTIONAL DEFAULTS RELATION SCHEMA
/////////////////////////////////////////

export type ProfileOptionalDefaultsRelations = {
  user: UserOptionalDefaultsWithRelations;
  organization: OrganizationOptionalDefaultsWithRelations;
  mcpServers: ProfileMcpServerOptionalDefaultsWithRelations[];
  debugLogs: DebugLogOptionalDefaultsWithRelations[];
};

export type ProfileOptionalDefaultsWithRelations = z.infer<typeof ProfileOptionalDefaultsSchema> & ProfileOptionalDefaultsRelations

export const ProfileOptionalDefaultsWithRelationsSchema: z.ZodType<ProfileOptionalDefaultsWithRelations> = ProfileOptionalDefaultsSchema.merge(z.object({
  user: z.lazy(() => UserOptionalDefaultsWithRelationsSchema),
  organization: z.lazy(() => OrganizationOptionalDefaultsWithRelationsSchema),
  mcpServers: z.lazy(() => ProfileMcpServerOptionalDefaultsWithRelationsSchema).array(),
  debugLogs: z.lazy(() => DebugLogOptionalDefaultsWithRelationsSchema).array(),
}))

export default ProfileSchema;
