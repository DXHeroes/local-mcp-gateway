import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { MigrationCountOrderByAggregateInputSchema } from './MigrationCountOrderByAggregateInputSchema';
import { MigrationMaxOrderByAggregateInputSchema } from './MigrationMaxOrderByAggregateInputSchema';
import { MigrationMinOrderByAggregateInputSchema } from './MigrationMinOrderByAggregateInputSchema';

export const MigrationOrderByWithAggregationInputSchema: z.ZodType<Prisma.MigrationOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  executedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => MigrationCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => MigrationMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => MigrationMinOrderByAggregateInputSchema).optional(),
});

export default MigrationOrderByWithAggregationInputSchema;
