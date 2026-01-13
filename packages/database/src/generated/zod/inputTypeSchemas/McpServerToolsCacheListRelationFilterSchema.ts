import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { McpServerToolsCacheWhereInputSchema } from './McpServerToolsCacheWhereInputSchema';

export const McpServerToolsCacheListRelationFilterSchema: z.ZodType<Prisma.McpServerToolsCacheListRelationFilter> = z.strictObject({
  every: z.lazy(() => McpServerToolsCacheWhereInputSchema).optional(),
  some: z.lazy(() => McpServerToolsCacheWhereInputSchema).optional(),
  none: z.lazy(() => McpServerToolsCacheWhereInputSchema).optional(),
});

export default McpServerToolsCacheListRelationFilterSchema;
