import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { SortOrderInputSchema } from './SortOrderInputSchema';
import { McpServerOrderByWithRelationInputSchema } from './McpServerOrderByWithRelationInputSchema';

export const McpServerToolsCacheOrderByWithRelationInputSchema: z.ZodType<Prisma.McpServerToolsCacheOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  mcpServerId: z.lazy(() => SortOrderSchema).optional(),
  toolName: z.lazy(() => SortOrderSchema).optional(),
  description: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  inputSchema: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  schemaHash: z.lazy(() => SortOrderSchema).optional(),
  fetchedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  mcpServer: z.lazy(() => McpServerOrderByWithRelationInputSchema).optional(),
});

export default McpServerToolsCacheOrderByWithRelationInputSchema;
