import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { MigrationCreateInputSchema } from '../inputTypeSchemas/MigrationCreateInputSchema'
import { MigrationUncheckedCreateInputSchema } from '../inputTypeSchemas/MigrationUncheckedCreateInputSchema'
// Select schema needs to be in file to prevent circular imports
//------------------------------------------------------

export const MigrationSelectSchema: z.ZodType<Prisma.MigrationSelect> = z.object({
  id: z.boolean().optional(),
  name: z.boolean().optional(),
  executedAt: z.boolean().optional(),
}).strict()

export const MigrationCreateArgsSchema: z.ZodType<Prisma.MigrationCreateArgs> = z.object({
  select: MigrationSelectSchema.optional(),
  data: z.union([ MigrationCreateInputSchema, MigrationUncheckedCreateInputSchema ]),
}).strict();

export default MigrationCreateArgsSchema;
