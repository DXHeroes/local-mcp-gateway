import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { DebugLogWhereInputSchema } from '../inputTypeSchemas/DebugLogWhereInputSchema'
import { DebugLogOrderByWithAggregationInputSchema } from '../inputTypeSchemas/DebugLogOrderByWithAggregationInputSchema'
import { DebugLogScalarFieldEnumSchema } from '../inputTypeSchemas/DebugLogScalarFieldEnumSchema'
import { DebugLogScalarWhereWithAggregatesInputSchema } from '../inputTypeSchemas/DebugLogScalarWhereWithAggregatesInputSchema'

export const DebugLogGroupByArgsSchema: z.ZodType<Prisma.DebugLogGroupByArgs> = z.object({
  where: DebugLogWhereInputSchema.optional(), 
  orderBy: z.union([ DebugLogOrderByWithAggregationInputSchema.array(), DebugLogOrderByWithAggregationInputSchema ]).optional(),
  by: DebugLogScalarFieldEnumSchema.array(), 
  having: DebugLogScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export default DebugLogGroupByArgsSchema;
