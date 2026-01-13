import { z } from 'zod';
import type { Prisma } from '../../prisma';

export const MigrationSelectSchema: z.ZodType<Prisma.MigrationSelect> = z.object({
  id: z.boolean().optional(),
  name: z.boolean().optional(),
  executedAt: z.boolean().optional(),
}).strict()

export default MigrationSelectSchema;
