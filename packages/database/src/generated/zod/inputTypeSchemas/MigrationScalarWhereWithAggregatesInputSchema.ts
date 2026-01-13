import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { StringWithAggregatesFilterSchema } from './StringWithAggregatesFilterSchema';
import { DateTimeWithAggregatesFilterSchema } from './DateTimeWithAggregatesFilterSchema';

export const MigrationScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.MigrationScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => MigrationScalarWhereWithAggregatesInputSchema), z.lazy(() => MigrationScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => MigrationScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => MigrationScalarWhereWithAggregatesInputSchema), z.lazy(() => MigrationScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  executedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export default MigrationScalarWhereWithAggregatesInputSchema;
