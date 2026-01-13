import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const McpServerToolsCacheCountOrderByAggregateInputSchema: z.ZodType<Prisma.McpServerToolsCacheCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  mcpServerId: z.lazy(() => SortOrderSchema).optional(),
  toolName: z.lazy(() => SortOrderSchema).optional(),
  description: z.lazy(() => SortOrderSchema).optional(),
  inputSchema: z.lazy(() => SortOrderSchema).optional(),
  schemaHash: z.lazy(() => SortOrderSchema).optional(),
  fetchedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
});

export default McpServerToolsCacheCountOrderByAggregateInputSchema;
