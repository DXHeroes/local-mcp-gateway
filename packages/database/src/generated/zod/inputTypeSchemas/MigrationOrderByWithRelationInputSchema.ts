import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const MigrationOrderByWithRelationInputSchema: z.ZodType<Prisma.MigrationOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  executedAt: z.lazy(() => SortOrderSchema).optional(),
});

export default MigrationOrderByWithRelationInputSchema;
