import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { DebugLogIncludeSchema } from '../inputTypeSchemas/DebugLogIncludeSchema'
import { DebugLogWhereInputSchema } from '../inputTypeSchemas/DebugLogWhereInputSchema'
import { DebugLogOrderByWithRelationInputSchema } from '../inputTypeSchemas/DebugLogOrderByWithRelationInputSchema'
import { DebugLogWhereUniqueInputSchema } from '../inputTypeSchemas/DebugLogWhereUniqueInputSchema'
import { DebugLogScalarFieldEnumSchema } from '../inputTypeSchemas/DebugLogScalarFieldEnumSchema'
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

export const DebugLogFindFirstArgsSchema: z.ZodType<Prisma.DebugLogFindFirstArgs> = z.object({
  select: DebugLogSelectSchema.optional(),
  include: z.lazy(() => DebugLogIncludeSchema).optional(),
  where: DebugLogWhereInputSchema.optional(), 
  orderBy: z.union([ DebugLogOrderByWithRelationInputSchema.array(), DebugLogOrderByWithRelationInputSchema ]).optional(),
  cursor: DebugLogWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ DebugLogScalarFieldEnumSchema, DebugLogScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export default DebugLogFindFirstArgsSchema;
