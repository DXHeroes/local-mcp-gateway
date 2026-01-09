import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { McpServerToolsCacheUpdateManyMutationInputSchema } from '../inputTypeSchemas/McpServerToolsCacheUpdateManyMutationInputSchema'
import { McpServerToolsCacheUncheckedUpdateManyInputSchema } from '../inputTypeSchemas/McpServerToolsCacheUncheckedUpdateManyInputSchema'
import { McpServerToolsCacheWhereInputSchema } from '../inputTypeSchemas/McpServerToolsCacheWhereInputSchema'

export const McpServerToolsCacheUpdateManyArgsSchema: z.ZodType<Prisma.McpServerToolsCacheUpdateManyArgs> = z.object({
  data: z.union([ McpServerToolsCacheUpdateManyMutationInputSchema, McpServerToolsCacheUncheckedUpdateManyInputSchema ]),
  where: McpServerToolsCacheWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export default McpServerToolsCacheUpdateManyArgsSchema;
