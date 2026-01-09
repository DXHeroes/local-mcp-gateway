import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { McpServerWhereInputSchema } from '../inputTypeSchemas/McpServerWhereInputSchema'

export const McpServerDeleteManyArgsSchema: z.ZodType<Prisma.McpServerDeleteManyArgs> = z.object({
  where: McpServerWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export default McpServerDeleteManyArgsSchema;
