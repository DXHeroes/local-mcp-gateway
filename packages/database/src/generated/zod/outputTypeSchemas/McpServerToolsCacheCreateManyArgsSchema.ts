import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { McpServerToolsCacheCreateManyInputSchema } from '../inputTypeSchemas/McpServerToolsCacheCreateManyInputSchema'

export const McpServerToolsCacheCreateManyArgsSchema: z.ZodType<Prisma.McpServerToolsCacheCreateManyArgs> = z.object({
  data: z.union([ McpServerToolsCacheCreateManyInputSchema, McpServerToolsCacheCreateManyInputSchema.array() ]),
}).strict();

export default McpServerToolsCacheCreateManyArgsSchema;
