import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const DebugLogOrderByRelationAggregateInputSchema: z.ZodType<Prisma.DebugLogOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export default DebugLogOrderByRelationAggregateInputSchema;
