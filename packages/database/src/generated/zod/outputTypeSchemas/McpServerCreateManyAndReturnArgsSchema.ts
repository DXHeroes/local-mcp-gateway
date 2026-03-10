import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { McpServerCreateManyInputSchema } from '../inputTypeSchemas/McpServerCreateManyInputSchema'

export const McpServerCreateManyAndReturnArgsSchema: z.ZodType<Prisma.McpServerCreateManyAndReturnArgs> = z.object({
  data: z.union([ McpServerCreateManyInputSchema, McpServerCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export default McpServerCreateManyAndReturnArgsSchema;
