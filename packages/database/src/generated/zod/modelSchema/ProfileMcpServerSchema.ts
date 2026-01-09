import { z } from 'zod';
import { ProfileWithRelationsSchema, ProfileOptionalDefaultsWithRelationsSchema } from './ProfileSchema'
import type { ProfileWithRelations, ProfileOptionalDefaultsWithRelations } from './ProfileSchema'
import { McpServerWithRelationsSchema, McpServerOptionalDefaultsWithRelationsSchema } from './McpServerSchema'
import type { McpServerWithRelations, McpServerOptionalDefaultsWithRelations } from './McpServerSchema'
import { ProfileMcpServerToolWithRelationsSchema, ProfileMcpServerToolOptionalDefaultsWithRelationsSchema } from './ProfileMcpServerToolSchema'
import type { ProfileMcpServerToolWithRelations, ProfileMcpServerToolOptionalDefaultsWithRelations } from './ProfileMcpServerToolSchema'

/////////////////////////////////////////
// PROFILE MCP SERVER SCHEMA
/////////////////////////////////////////

/**
 * Many-to-many relationship between profiles and MCP servers
 */
export const ProfileMcpServerSchema = z.object({
  id: z.uuid(),
  profileId: z.string(),
  mcpServerId: z.string(),
  order: z.number().int(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type ProfileMcpServer = z.infer<typeof ProfileMcpServerSchema>

/////////////////////////////////////////
// PROFILE MCP SERVER OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const ProfileMcpServerOptionalDefaultsSchema = ProfileMcpServerSchema.merge(z.object({
  id: z.uuid().optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type ProfileMcpServerOptionalDefaults = z.infer<typeof ProfileMcpServerOptionalDefaultsSchema>

/////////////////////////////////////////
// PROFILE MCP SERVER RELATION SCHEMA
/////////////////////////////////////////

export type ProfileMcpServerRelations = {
  profile: ProfileWithRelations;
  mcpServer: McpServerWithRelations;
  tools: ProfileMcpServerToolWithRelations[];
};

export type ProfileMcpServerWithRelations = z.infer<typeof ProfileMcpServerSchema> & ProfileMcpServerRelations

export const ProfileMcpServerWithRelationsSchema: z.ZodType<ProfileMcpServerWithRelations> = ProfileMcpServerSchema.merge(z.object({
  profile: z.lazy(() => ProfileWithRelationsSchema),
  mcpServer: z.lazy(() => McpServerWithRelationsSchema),
  tools: z.lazy(() => ProfileMcpServerToolWithRelationsSchema).array(),
}))

/////////////////////////////////////////
// PROFILE MCP SERVER OPTIONAL DEFAULTS RELATION SCHEMA
/////////////////////////////////////////

export type ProfileMcpServerOptionalDefaultsRelations = {
  profile: ProfileOptionalDefaultsWithRelations;
  mcpServer: McpServerOptionalDefaultsWithRelations;
  tools: ProfileMcpServerToolOptionalDefaultsWithRelations[];
};

export type ProfileMcpServerOptionalDefaultsWithRelations = z.infer<typeof ProfileMcpServerOptionalDefaultsSchema> & ProfileMcpServerOptionalDefaultsRelations

export const ProfileMcpServerOptionalDefaultsWithRelationsSchema: z.ZodType<ProfileMcpServerOptionalDefaultsWithRelations> = ProfileMcpServerOptionalDefaultsSchema.merge(z.object({
  profile: z.lazy(() => ProfileOptionalDefaultsWithRelationsSchema),
  mcpServer: z.lazy(() => McpServerOptionalDefaultsWithRelationsSchema),
  tools: z.lazy(() => ProfileMcpServerToolOptionalDefaultsWithRelationsSchema).array(),
}))

export default ProfileMcpServerSchema;
