import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { MigrationWhereInputSchema } from './MigrationWhereInputSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';

export const MigrationWhereUniqueInputSchema: z.ZodType<Prisma.MigrationWhereUniqueInput> = z.union([
  z.object({
    id: z.uuid(),
    name: z.string(),
  }),
  z.object({
    id: z.uuid(),
  }),
  z.object({
    name: z.string(),
  }),
])
.and(z.strictObject({
  id: z.uuid().optional(),
  name: z.string().optional(),
  AND: z.union([ z.lazy(() => MigrationWhereInputSchema), z.lazy(() => MigrationWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => MigrationWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => MigrationWhereInputSchema), z.lazy(() => MigrationWhereInputSchema).array() ]).optional(),
  executedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
}));

export default MigrationWhereUniqueInputSchema;
