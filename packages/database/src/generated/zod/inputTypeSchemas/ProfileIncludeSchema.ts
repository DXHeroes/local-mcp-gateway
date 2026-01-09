import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { ProfileMcpServerFindManyArgsSchema } from "../outputTypeSchemas/ProfileMcpServerFindManyArgsSchema"
import { DebugLogFindManyArgsSchema } from "../outputTypeSchemas/DebugLogFindManyArgsSchema"
import { ProfileCountOutputTypeArgsSchema } from "../outputTypeSchemas/ProfileCountOutputTypeArgsSchema"

export const ProfileIncludeSchema: z.ZodType<Prisma.ProfileInclude> = z.object({
  mcpServers: z.union([z.boolean(),z.lazy(() => ProfileMcpServerFindManyArgsSchema)]).optional(),
  debugLogs: z.union([z.boolean(),z.lazy(() => DebugLogFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => ProfileCountOutputTypeArgsSchema)]).optional(),
}).strict();

export default ProfileIncludeSchema;
