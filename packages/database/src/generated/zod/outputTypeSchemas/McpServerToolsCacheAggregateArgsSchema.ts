import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { McpServerToolsCacheWhereInputSchema } from '../inputTypeSchemas/McpServerToolsCacheWhereInputSchema'
import { McpServerToolsCacheOrderByWithRelationInputSchema } from '../inputTypeSchemas/McpServerToolsCacheOrderByWithRelationInputSchema'
import { McpServerToolsCacheWhereUniqueInputSchema } from '../inputTypeSchemas/McpServerToolsCacheWhereUniqueInputSchema'

export const McpServerToolsCacheAggregateArgsSchema: z.ZodType<Prisma.McpServerToolsCacheAggregateArgs> = z.object({
  where: McpServerToolsCacheWhereInputSchema.optional(), 
  orderBy: z.union([ McpServerToolsCacheOrderByWithRelationInputSchema.array(), McpServerToolsCacheOrderByWithRelationInputSchema ]).optional(),
  cursor: McpServerToolsCacheWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export default McpServerToolsCacheAggregateArgsSchema;
