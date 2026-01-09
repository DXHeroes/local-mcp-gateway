import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { DebugLogIncludeSchema } from '../inputTypeSchemas/DebugLogIncludeSchema'
import { DebugLogWhereUniqueInputSchema } from '../inputTypeSchemas/DebugLogWhereUniqueInputSchema'
import { DebugLogCreateInputSchema } from '../inputTypeSchemas/DebugLogCreateInputSchema'
import { DebugLogUncheckedCreateInputSchema } from '../inputTypeSchemas/DebugLogUncheckedCreateInputSchema'
import { DebugLogUpdateInputSchema } from '../inputTypeSchemas/DebugLogUpdateInputSchema'
import { DebugLogUncheckedUpdateInputSchema } from '../inputTypeSchemas/DebugLogUncheckedUpdateInputSchema'
import { ProfileArgsSchema } from "../outputTypeSchemas/ProfileArgsSchema"
import { McpServerArgsSchema } from "../outputTypeSchemas/McpServerArgsSchema"
// Select schema needs to be in file to prevent circular imports
//------------------------------------------------------

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

export const DebugLogUpsertArgsSchema: z.ZodType<Prisma.DebugLogUpsertArgs> = z.object({
  select: DebugLogSelectSchema.optional(),
  include: z.lazy(() => DebugLogIncludeSchema).optional(),
  where: DebugLogWhereUniqueInputSchema, 
  create: z.union([ DebugLogCreateInputSchema, DebugLogUncheckedCreateInputSchema ]),
  update: z.union([ DebugLogUpdateInputSchema, DebugLogUncheckedUpdateInputSchema ]),
}).strict();

export default DebugLogUpsertArgsSchema;
