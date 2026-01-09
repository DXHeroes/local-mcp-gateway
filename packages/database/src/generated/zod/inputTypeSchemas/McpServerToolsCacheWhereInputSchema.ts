import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { StringFilterSchema } from './StringFilterSchema';
import { StringNullableFilterSchema } from './StringNullableFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';
import { McpServerScalarRelationFilterSchema } from './McpServerScalarRelationFilterSchema';
import { McpServerWhereInputSchema } from './McpServerWhereInputSchema';

export const McpServerToolsCacheWhereInputSchema: z.ZodType<Prisma.McpServerToolsCacheWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => McpServerToolsCacheWhereInputSchema), z.lazy(() => McpServerToolsCacheWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => McpServerToolsCacheWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => McpServerToolsCacheWhereInputSchema), z.lazy(() => McpServerToolsCacheWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  mcpServerId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  toolName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  description: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  inputSchema: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  schemaHash: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  fetchedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  mcpServer: z.union([ z.lazy(() => McpServerScalarRelationFilterSchema), z.lazy(() => McpServerWhereInputSchema) ]).optional(),
});

export default McpServerToolsCacheWhereInputSchema;
