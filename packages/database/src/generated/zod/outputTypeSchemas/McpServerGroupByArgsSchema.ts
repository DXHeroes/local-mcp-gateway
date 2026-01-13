import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { McpServerWhereInputSchema } from '../inputTypeSchemas/McpServerWhereInputSchema'
import { McpServerOrderByWithAggregationInputSchema } from '../inputTypeSchemas/McpServerOrderByWithAggregationInputSchema'
import { McpServerScalarFieldEnumSchema } from '../inputTypeSchemas/McpServerScalarFieldEnumSchema'
import { McpServerScalarWhereWithAggregatesInputSchema } from '../inputTypeSchemas/McpServerScalarWhereWithAggregatesInputSchema'

export const McpServerGroupByArgsSchema: z.ZodType<Prisma.McpServerGroupByArgs> = z.object({
  where: McpServerWhereInputSchema.optional(), 
  orderBy: z.union([ McpServerOrderByWithAggregationInputSchema.array(), McpServerOrderByWithAggregationInputSchema ]).optional(),
  by: McpServerScalarFieldEnumSchema.array(), 
  having: McpServerScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export default McpServerGroupByArgsSchema;
