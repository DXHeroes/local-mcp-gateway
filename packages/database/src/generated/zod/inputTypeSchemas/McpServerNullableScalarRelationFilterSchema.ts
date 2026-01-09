import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { McpServerWhereInputSchema } from './McpServerWhereInputSchema';

export const McpServerNullableScalarRelationFilterSchema: z.ZodType<Prisma.McpServerNullableScalarRelationFilter> = z.strictObject({
  is: z.lazy(() => McpServerWhereInputSchema).optional().nullable(),
  isNot: z.lazy(() => McpServerWhereInputSchema).optional().nullable(),
});

export default McpServerNullableScalarRelationFilterSchema;
