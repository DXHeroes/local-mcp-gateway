import type { Prisma } from '../../prisma';

import { z } from 'zod';

export const MigrationUncheckedCreateInputSchema: z.ZodType<Prisma.MigrationUncheckedCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  executedAt: z.coerce.date().optional(),
});

export default MigrationUncheckedCreateInputSchema;
