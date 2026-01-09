import { z } from 'zod';
import { ProfileMcpServerWithRelationsSchema, ProfileMcpServerOptionalDefaultsWithRelationsSchema } from './ProfileMcpServerSchema'
import type { ProfileMcpServerWithRelations, ProfileMcpServerOptionalDefaultsWithRelations } from './ProfileMcpServerSchema'

/////////////////////////////////////////
// PROFILE MCP SERVER TOOL SCHEMA
/////////////////////////////////////////

/**
 * Per-profile tool customizations for MCP servers
 */
export const ProfileMcpServerToolSchema = z.object({
  id: z.uuid(),
  profileMcpServerId: z.string(),
  toolName: z.string(),
  isEnabled: z.boolean(),
  customName: z.string().nullable(),
  customDescription: z.string().nullable(),
  customInputSchema: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type ProfileMcpServerTool = z.infer<typeof ProfileMcpServerToolSchema>

/////////////////////////////////////////
// PROFILE MCP SERVER TOOL OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const ProfileMcpServerToolOptionalDefaultsSchema = ProfileMcpServerToolSchema.merge(z.object({
  id: z.uuid().optional(),
  isEnabled: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type ProfileMcpServerToolOptionalDefaults = z.infer<typeof ProfileMcpServerToolOptionalDefaultsSchema>

/////////////////////////////////////////
// PROFILE MCP SERVER TOOL RELATION SCHEMA
/////////////////////////////////////////

export type ProfileMcpServerToolRelations = {
  profileMcpServer: ProfileMcpServerWithRelations;
};

export type ProfileMcpServerToolWithRelations = z.infer<typeof ProfileMcpServerToolSchema> & ProfileMcpServerToolRelations

export const ProfileMcpServerToolWithRelationsSchema: z.ZodType<ProfileMcpServerToolWithRelations> = ProfileMcpServerToolSchema.merge(z.object({
  profileMcpServer: z.lazy(() => ProfileMcpServerWithRelationsSchema),
}))

/////////////////////////////////////////
// PROFILE MCP SERVER TOOL OPTIONAL DEFAULTS RELATION SCHEMA
/////////////////////////////////////////

export type ProfileMcpServerToolOptionalDefaultsRelations = {
  profileMcpServer: ProfileMcpServerOptionalDefaultsWithRelations;
};

export type ProfileMcpServerToolOptionalDefaultsWithRelations = z.infer<typeof ProfileMcpServerToolOptionalDefaultsSchema> & ProfileMcpServerToolOptionalDefaultsRelations

export const ProfileMcpServerToolOptionalDefaultsWithRelationsSchema: z.ZodType<ProfileMcpServerToolOptionalDefaultsWithRelations> = ProfileMcpServerToolOptionalDefaultsSchema.merge(z.object({
  profileMcpServer: z.lazy(() => ProfileMcpServerOptionalDefaultsWithRelationsSchema),
}))

export default ProfileMcpServerToolSchema;
