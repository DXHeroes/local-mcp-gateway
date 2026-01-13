import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { ProfileArgsSchema } from "../outputTypeSchemas/ProfileArgsSchema"
import { McpServerArgsSchema } from "../outputTypeSchemas/McpServerArgsSchema"
import { ProfileMcpServerToolFindManyArgsSchema } from "../outputTypeSchemas/ProfileMcpServerToolFindManyArgsSchema"
import { ProfileMcpServerCountOutputTypeArgsSchema } from "../outputTypeSchemas/ProfileMcpServerCountOutputTypeArgsSchema"

export const ProfileMcpServerIncludeSchema: z.ZodType<Prisma.ProfileMcpServerInclude> = z.object({
  profile: z.union([z.boolean(),z.lazy(() => ProfileArgsSchema)]).optional(),
  mcpServer: z.union([z.boolean(),z.lazy(() => McpServerArgsSchema)]).optional(),
  tools: z.union([z.boolean(),z.lazy(() => ProfileMcpServerToolFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => ProfileMcpServerCountOutputTypeArgsSchema)]).optional(),
}).strict();

export default ProfileMcpServerIncludeSchema;
