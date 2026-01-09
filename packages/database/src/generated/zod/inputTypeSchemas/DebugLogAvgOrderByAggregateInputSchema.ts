import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const DebugLogAvgOrderByAggregateInputSchema: z.ZodType<Prisma.DebugLogAvgOrderByAggregateInput> = z.strictObject({
  durationMs: z.lazy(() => SortOrderSchema).optional(),
});

export default DebugLogAvgOrderByAggregateInputSchema;
