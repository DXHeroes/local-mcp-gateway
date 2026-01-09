import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { SortOrderInputSchema } from './SortOrderInputSchema';
import { DebugLogCountOrderByAggregateInputSchema } from './DebugLogCountOrderByAggregateInputSchema';
import { DebugLogAvgOrderByAggregateInputSchema } from './DebugLogAvgOrderByAggregateInputSchema';
import { DebugLogMaxOrderByAggregateInputSchema } from './DebugLogMaxOrderByAggregateInputSchema';
import { DebugLogMinOrderByAggregateInputSchema } from './DebugLogMinOrderByAggregateInputSchema';
import { DebugLogSumOrderByAggregateInputSchema } from './DebugLogSumOrderByAggregateInputSchema';

export const DebugLogOrderByWithAggregationInputSchema: z.ZodType<Prisma.DebugLogOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  profileId: z.lazy(() => SortOrderSchema).optional(),
  mcpServerId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  requestType: z.lazy(() => SortOrderSchema).optional(),
  requestPayload: z.lazy(() => SortOrderSchema).optional(),
  responsePayload: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  errorMessage: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  durationMs: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => DebugLogCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => DebugLogAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => DebugLogMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => DebugLogMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => DebugLogSumOrderByAggregateInputSchema).optional(),
});

export default DebugLogOrderByWithAggregationInputSchema;
