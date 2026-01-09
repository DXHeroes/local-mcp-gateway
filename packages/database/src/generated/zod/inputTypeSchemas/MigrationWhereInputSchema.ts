import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { StringFilterSchema } from './StringFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';

export const MigrationWhereInputSchema: z.ZodType<Prisma.MigrationWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => MigrationWhereInputSchema), z.lazy(() => MigrationWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => MigrationWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => MigrationWhereInputSchema), z.lazy(() => MigrationWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  executedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
});

export default MigrationWhereInputSchema;
