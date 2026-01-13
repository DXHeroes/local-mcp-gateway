import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { DebugLogWhereInputSchema } from '../inputTypeSchemas/DebugLogWhereInputSchema'
import { DebugLogOrderByWithRelationInputSchema } from '../inputTypeSchemas/DebugLogOrderByWithRelationInputSchema'
import { DebugLogWhereUniqueInputSchema } from '../inputTypeSchemas/DebugLogWhereUniqueInputSchema'

export const DebugLogAggregateArgsSchema: z.ZodType<Prisma.DebugLogAggregateArgs> = z.object({
  where: DebugLogWhereInputSchema.optional(), 
  orderBy: z.union([ DebugLogOrderByWithRelationInputSchema.array(), DebugLogOrderByWithRelationInputSchema ]).optional(),
  cursor: DebugLogWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export default DebugLogAggregateArgsSchema;
