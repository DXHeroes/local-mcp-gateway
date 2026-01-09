import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { McpServerWhereInputSchema } from './McpServerWhereInputSchema';

export const McpServerScalarRelationFilterSchema: z.ZodType<Prisma.McpServerScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => McpServerWhereInputSchema).optional(),
  isNot: z.lazy(() => McpServerWhereInputSchema).optional(),
});

export default McpServerScalarRelationFilterSchema;
