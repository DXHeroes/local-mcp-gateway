import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { StringWithAggregatesFilterSchema } from './StringWithAggregatesFilterSchema';
import { StringNullableWithAggregatesFilterSchema } from './StringNullableWithAggregatesFilterSchema';
import { DateTimeWithAggregatesFilterSchema } from './DateTimeWithAggregatesFilterSchema';

export const McpServerToolsCacheScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.McpServerToolsCacheScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => McpServerToolsCacheScalarWhereWithAggregatesInputSchema), z.lazy(() => McpServerToolsCacheScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => McpServerToolsCacheScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => McpServerToolsCacheScalarWhereWithAggregatesInputSchema), z.lazy(() => McpServerToolsCacheScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  mcpServerId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  toolName: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  description: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  inputSchema: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  schemaHash: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  fetchedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export default McpServerToolsCacheScalarWhereWithAggregatesInputSchema;
