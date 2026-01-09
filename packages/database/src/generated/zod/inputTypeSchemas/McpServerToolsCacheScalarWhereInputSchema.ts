import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { StringFilterSchema } from './StringFilterSchema';
import { StringNullableFilterSchema } from './StringNullableFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';

export const McpServerToolsCacheScalarWhereInputSchema: z.ZodType<Prisma.McpServerToolsCacheScalarWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => McpServerToolsCacheScalarWhereInputSchema), z.lazy(() => McpServerToolsCacheScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => McpServerToolsCacheScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => McpServerToolsCacheScalarWhereInputSchema), z.lazy(() => McpServerToolsCacheScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  mcpServerId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  toolName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  description: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  inputSchema: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  schemaHash: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  fetchedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
});

export default McpServerToolsCacheScalarWhereInputSchema;
