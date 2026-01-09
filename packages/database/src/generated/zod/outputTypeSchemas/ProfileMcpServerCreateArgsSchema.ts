import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { ProfileMcpServerIncludeSchema } from '../inputTypeSchemas/ProfileMcpServerIncludeSchema'
import { ProfileMcpServerCreateInputSchema } from '../inputTypeSchemas/ProfileMcpServerCreateInputSchema'
import { ProfileMcpServerUncheckedCreateInputSchema } from '../inputTypeSchemas/ProfileMcpServerUncheckedCreateInputSchema'
import { ProfileArgsSchema } from "../outputTypeSchemas/ProfileArgsSchema"
import { McpServerArgsSchema } from "../outputTypeSchemas/McpServerArgsSchema"
import { ProfileMcpServerToolFindManyArgsSchema } from "../outputTypeSchemas/ProfileMcpServerToolFindManyArgsSchema"
import { ProfileMcpServerCountOutputTypeArgsSchema } from "../outputTypeSchemas/ProfileMcpServerCountOutputTypeArgsSchema"
// Select schema needs to be in file to prevent circular imports
//------------------------------------------------------

export const ProfileMcpServerSelectSchema: z.ZodType<Prisma.ProfileMcpServerSelect> = z.object({
  id: z.boolean().optional(),
  profileId: z.boolean().optional(),
  mcpServerId: z.boolean().optional(),
  order: z.boolean().optional(),
  isActive: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  profile: z.union([z.boolean(),z.lazy(() => ProfileArgsSchema)]).optional(),
  mcpServer: z.union([z.boolean(),z.lazy(() => McpServerArgsSchema)]).optional(),
  tools: z.union([z.boolean(),z.lazy(() => ProfileMcpServerToolFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => ProfileMcpServerCountOutputTypeArgsSchema)]).optional(),
}).strict()

export const ProfileMcpServerCreateArgsSchema: z.ZodType<Prisma.ProfileMcpServerCreateArgs> = z.object({
  select: ProfileMcpServerSelectSchema.optional(),
  include: z.lazy(() => ProfileMcpServerIncludeSchema).optional(),
  data: z.union([ ProfileMcpServerCreateInputSchema, ProfileMcpServerUncheckedCreateInputSchema ]),
}).strict();

export default ProfileMcpServerCreateArgsSchema;
