import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { McpServerCreateManyInputSchema } from '../inputTypeSchemas/McpServerCreateManyInputSchema'

export const McpServerCreateManyArgsSchema: z.ZodType<Prisma.McpServerCreateManyArgs> = z.object({
  data: z.union([ McpServerCreateManyInputSchema, McpServerCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export default McpServerCreateManyArgsSchema;
