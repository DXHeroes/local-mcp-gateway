import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { McpServerWhereInputSchema } from '../inputTypeSchemas/McpServerWhereInputSchema'
import { McpServerOrderByWithRelationInputSchema } from '../inputTypeSchemas/McpServerOrderByWithRelationInputSchema'
import { McpServerWhereUniqueInputSchema } from '../inputTypeSchemas/McpServerWhereUniqueInputSchema'

export const McpServerAggregateArgsSchema: z.ZodType<Prisma.McpServerAggregateArgs> = z.object({
  where: McpServerWhereInputSchema.optional(), 
  orderBy: z.union([ McpServerOrderByWithRelationInputSchema.array(), McpServerOrderByWithRelationInputSchema ]).optional(),
  cursor: McpServerWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export default McpServerAggregateArgsSchema;
