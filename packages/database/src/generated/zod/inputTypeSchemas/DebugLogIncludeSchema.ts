import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { ProfileArgsSchema } from "../outputTypeSchemas/ProfileArgsSchema"
import { McpServerArgsSchema } from "../outputTypeSchemas/McpServerArgsSchema"

export const DebugLogIncludeSchema: z.ZodType<Prisma.DebugLogInclude> = z.object({
  profile: z.union([z.boolean(),z.lazy(() => ProfileArgsSchema)]).optional(),
  mcpServer: z.union([z.boolean(),z.lazy(() => McpServerArgsSchema)]).optional(),
}).strict();

export default DebugLogIncludeSchema;
