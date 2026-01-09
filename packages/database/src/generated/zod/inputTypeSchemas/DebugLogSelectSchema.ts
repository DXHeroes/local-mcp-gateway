import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { ProfileArgsSchema } from "../outputTypeSchemas/ProfileArgsSchema"
import { McpServerArgsSchema } from "../outputTypeSchemas/McpServerArgsSchema"

export const DebugLogSelectSchema: z.ZodType<Prisma.DebugLogSelect> = z.object({
  id: z.boolean().optional(),
  profileId: z.boolean().optional(),
  mcpServerId: z.boolean().optional(),
  requestType: z.boolean().optional(),
  requestPayload: z.boolean().optional(),
  responsePayload: z.boolean().optional(),
  status: z.boolean().optional(),
  errorMessage: z.boolean().optional(),
  durationMs: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  profile: z.union([z.boolean(),z.lazy(() => ProfileArgsSchema)]).optional(),
  mcpServer: z.union([z.boolean(),z.lazy(() => McpServerArgsSchema)]).optional(),
}).strict()

export default DebugLogSelectSchema;
