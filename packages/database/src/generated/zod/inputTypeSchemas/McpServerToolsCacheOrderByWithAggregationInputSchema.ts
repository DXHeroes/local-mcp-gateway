import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { SortOrderInputSchema } from './SortOrderInputSchema';
import { McpServerToolsCacheCountOrderByAggregateInputSchema } from './McpServerToolsCacheCountOrderByAggregateInputSchema';
import { McpServerToolsCacheMaxOrderByAggregateInputSchema } from './McpServerToolsCacheMaxOrderByAggregateInputSchema';
import { McpServerToolsCacheMinOrderByAggregateInputSchema } from './McpServerToolsCacheMinOrderByAggregateInputSchema';

export const McpServerToolsCacheOrderByWithAggregationInputSchema: z.ZodType<Prisma.McpServerToolsCacheOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  mcpServerId: z.lazy(() => SortOrderSchema).optional(),
  toolName: z.lazy(() => SortOrderSchema).optional(),
  description: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  inputSchema: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  schemaHash: z.lazy(() => SortOrderSchema).optional(),
  fetchedAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => McpServerToolsCacheCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => McpServerToolsCacheMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => McpServerToolsCacheMinOrderByAggregateInputSchema).optional(),
});

export default McpServerToolsCacheOrderByWithAggregationInputSchema;
