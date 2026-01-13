import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const MigrationMaxOrderByAggregateInputSchema: z.ZodType<Prisma.MigrationMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  executedAt: z.lazy(() => SortOrderSchema).optional(),
});

export default MigrationMaxOrderByAggregateInputSchema;
