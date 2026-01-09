import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { McpServerSelectSchema } from '../inputTypeSchemas/McpServerSelectSchema';
import { McpServerIncludeSchema } from '../inputTypeSchemas/McpServerIncludeSchema';

export const McpServerArgsSchema: z.ZodType<Prisma.McpServerDefaultArgs> = z.object({
  select: z.lazy(() => McpServerSelectSchema).optional(),
  include: z.lazy(() => McpServerIncludeSchema).optional(),
}).strict();

export default McpServerArgsSchema;
