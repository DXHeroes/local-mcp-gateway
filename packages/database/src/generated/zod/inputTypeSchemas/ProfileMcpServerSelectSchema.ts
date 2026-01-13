import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { ProfileArgsSchema } from "../outputTypeSchemas/ProfileArgsSchema"
import { McpServerArgsSchema } from "../outputTypeSchemas/McpServerArgsSchema"
import { ProfileMcpServerToolFindManyArgsSchema } from "../outputTypeSchemas/ProfileMcpServerToolFindManyArgsSchema"
import { ProfileMcpServerCountOutputTypeArgsSchema } from "../outputTypeSchemas/ProfileMcpServerCountOutputTypeArgsSchema"

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

export default ProfileMcpServerSelectSchema;
