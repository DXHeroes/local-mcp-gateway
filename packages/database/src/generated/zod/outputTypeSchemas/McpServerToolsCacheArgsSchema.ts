import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { McpServerToolsCacheSelectSchema } from '../inputTypeSchemas/McpServerToolsCacheSelectSchema';
import { McpServerToolsCacheIncludeSchema } from '../inputTypeSchemas/McpServerToolsCacheIncludeSchema';

export const McpServerToolsCacheArgsSchema: z.ZodType<Prisma.McpServerToolsCacheDefaultArgs> = z.object({
  select: z.lazy(() => McpServerToolsCacheSelectSchema).optional(),
  include: z.lazy(() => McpServerToolsCacheIncludeSchema).optional(),
}).strict();

export default McpServerToolsCacheArgsSchema;
