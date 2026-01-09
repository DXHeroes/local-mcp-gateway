import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const MigrationCountOrderByAggregateInputSchema: z.ZodType<Prisma.MigrationCountOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  executedAt: z.lazy(() => SortOrderSchema).optional(),
});

export default MigrationCountOrderByAggregateInputSchema;
