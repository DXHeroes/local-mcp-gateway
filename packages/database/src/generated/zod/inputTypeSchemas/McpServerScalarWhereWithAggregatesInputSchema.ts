import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { StringWithAggregatesFilterSchema } from './StringWithAggregatesFilterSchema';
import { StringNullableWithAggregatesFilterSchema } from './StringNullableWithAggregatesFilterSchema';
import { DateTimeWithAggregatesFilterSchema } from './DateTimeWithAggregatesFilterSchema';

export const McpServerScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.McpServerScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => McpServerScalarWhereWithAggregatesInputSchema), z.lazy(() => McpServerScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => McpServerScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => McpServerScalarWhereWithAggregatesInputSchema), z.lazy(() => McpServerScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  type: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  config: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  oauthConfig: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  apiKeyConfig: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export default McpServerScalarWhereWithAggregatesInputSchema;
