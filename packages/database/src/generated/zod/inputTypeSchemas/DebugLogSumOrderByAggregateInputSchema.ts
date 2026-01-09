import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const DebugLogSumOrderByAggregateInputSchema: z.ZodType<Prisma.DebugLogSumOrderByAggregateInput> = z.strictObject({
  durationMs: z.lazy(() => SortOrderSchema).optional(),
});

export default DebugLogSumOrderByAggregateInputSchema;
