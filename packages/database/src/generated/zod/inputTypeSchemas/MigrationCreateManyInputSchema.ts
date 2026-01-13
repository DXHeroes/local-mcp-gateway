import type { Prisma } from '../../prisma';

import { z } from 'zod';

export const MigrationCreateManyInputSchema: z.ZodType<Prisma.MigrationCreateManyInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  executedAt: z.coerce.date().optional(),
});

export default MigrationCreateManyInputSchema;
