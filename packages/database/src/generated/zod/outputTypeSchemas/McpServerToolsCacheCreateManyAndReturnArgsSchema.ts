import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { McpServerToolsCacheCreateManyInputSchema } from '../inputTypeSchemas/McpServerToolsCacheCreateManyInputSchema'

export const McpServerToolsCacheCreateManyAndReturnArgsSchema: z.ZodType<Prisma.McpServerToolsCacheCreateManyAndReturnArgs> = z.object({
  data: z.union([ McpServerToolsCacheCreateManyInputSchema, McpServerToolsCacheCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict();

export default McpServerToolsCacheCreateManyAndReturnArgsSchema;
