import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { McpServerToolsCacheMcpServerIdToolNameCompoundUniqueInputSchema } from './McpServerToolsCacheMcpServerIdToolNameCompoundUniqueInputSchema';
import { McpServerToolsCacheWhereInputSchema } from './McpServerToolsCacheWhereInputSchema';
import { StringFilterSchema } from './StringFilterSchema';
import { StringNullableFilterSchema } from './StringNullableFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';
import { McpServerScalarRelationFilterSchema } from './McpServerScalarRelationFilterSchema';
import { McpServerWhereInputSchema } from './McpServerWhereInputSchema';

export const McpServerToolsCacheWhereUniqueInputSchema: z.ZodType<Prisma.McpServerToolsCacheWhereUniqueInput> = z.union([
  z.object({
    id: z.uuid(),
    mcpServerId_toolName: z.lazy(() => McpServerToolsCacheMcpServerIdToolNameCompoundUniqueInputSchema),
  }),
  z.object({
    id: z.uuid(),
  }),
  z.object({
    mcpServerId_toolName: z.lazy(() => McpServerToolsCacheMcpServerIdToolNameCompoundUniqueInputSchema),
  }),
])
.and(z.strictObject({
  id: z.uuid().optional(),
  mcpServerId_toolName: z.lazy(() => McpServerToolsCacheMcpServerIdToolNameCompoundUniqueInputSchema).optional(),
  AND: z.union([ z.lazy(() => McpServerToolsCacheWhereInputSchema), z.lazy(() => McpServerToolsCacheWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => McpServerToolsCacheWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => McpServerToolsCacheWhereInputSchema), z.lazy(() => McpServerToolsCacheWhereInputSchema).array() ]).optional(),
  mcpServerId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  toolName: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  description: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  inputSchema: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  schemaHash: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  fetchedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  mcpServer: z.union([ z.lazy(() => McpServerScalarRelationFilterSchema), z.lazy(() => McpServerWhereInputSchema) ]).optional(),
}));

export default McpServerToolsCacheWhereUniqueInputSchema;
