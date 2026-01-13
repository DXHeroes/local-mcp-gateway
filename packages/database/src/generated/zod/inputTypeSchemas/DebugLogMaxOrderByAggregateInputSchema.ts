import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const DebugLogMaxOrderByAggregateInputSchema: z.ZodType<Prisma.DebugLogMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  profileId: z.lazy(() => SortOrderSchema).optional(),
  mcpServerId: z.lazy(() => SortOrderSchema).optional(),
  requestType: z.lazy(() => SortOrderSchema).optional(),
  requestPayload: z.lazy(() => SortOrderSchema).optional(),
  responsePayload: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  errorMessage: z.lazy(() => SortOrderSchema).optional(),
  durationMs: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
});

export default DebugLogMaxOrderByAggregateInputSchema;
