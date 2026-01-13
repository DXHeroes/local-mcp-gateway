import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { McpServerToolsCacheWhereInputSchema } from '../inputTypeSchemas/McpServerToolsCacheWhereInputSchema'
import { McpServerToolsCacheOrderByWithAggregationInputSchema } from '../inputTypeSchemas/McpServerToolsCacheOrderByWithAggregationInputSchema'
import { McpServerToolsCacheScalarFieldEnumSchema } from '../inputTypeSchemas/McpServerToolsCacheScalarFieldEnumSchema'
import { McpServerToolsCacheScalarWhereWithAggregatesInputSchema } from '../inputTypeSchemas/McpServerToolsCacheScalarWhereWithAggregatesInputSchema'

export const McpServerToolsCacheGroupByArgsSchema: z.ZodType<Prisma.McpServerToolsCacheGroupByArgs> = z.object({
  where: McpServerToolsCacheWhereInputSchema.optional(), 
  orderBy: z.union([ McpServerToolsCacheOrderByWithAggregationInputSchema.array(), McpServerToolsCacheOrderByWithAggregationInputSchema ]).optional(),
  by: McpServerToolsCacheScalarFieldEnumSchema.array(), 
  having: McpServerToolsCacheScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export default McpServerToolsCacheGroupByArgsSchema;
