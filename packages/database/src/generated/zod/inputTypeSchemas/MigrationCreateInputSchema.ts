import type { Prisma } from '../../prisma';

import { z } from 'zod';

export const MigrationCreateInputSchema: z.ZodType<Prisma.MigrationCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  executedAt: z.coerce.date().optional(),
});

export default MigrationCreateInputSchema;
