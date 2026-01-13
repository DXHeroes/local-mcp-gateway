import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { SortOrderInputSchema } from './SortOrderInputSchema';
import { McpServerCountOrderByAggregateInputSchema } from './McpServerCountOrderByAggregateInputSchema';
import { McpServerMaxOrderByAggregateInputSchema } from './McpServerMaxOrderByAggregateInputSchema';
import { McpServerMinOrderByAggregateInputSchema } from './McpServerMinOrderByAggregateInputSchema';

export const McpServerOrderByWithAggregationInputSchema: z.ZodType<Prisma.McpServerOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  config: z.lazy(() => SortOrderSchema).optional(),
  oauthConfig: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  apiKeyConfig: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => McpServerCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => McpServerMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => McpServerMinOrderByAggregateInputSchema).optional(),
});

export default McpServerOrderByWithAggregationInputSchema;
