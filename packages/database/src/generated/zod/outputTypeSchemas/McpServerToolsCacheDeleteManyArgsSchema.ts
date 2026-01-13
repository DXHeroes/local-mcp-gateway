import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { McpServerToolsCacheWhereInputSchema } from '../inputTypeSchemas/McpServerToolsCacheWhereInputSchema'

export const McpServerToolsCacheDeleteManyArgsSchema: z.ZodType<Prisma.McpServerToolsCacheDeleteManyArgs> = z.object({
  where: McpServerToolsCacheWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export default McpServerToolsCacheDeleteManyArgsSchema;
