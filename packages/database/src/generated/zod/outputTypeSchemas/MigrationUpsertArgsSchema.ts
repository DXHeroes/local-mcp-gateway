import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { MigrationWhereUniqueInputSchema } from '../inputTypeSchemas/MigrationWhereUniqueInputSchema'
import { MigrationCreateInputSchema } from '../inputTypeSchemas/MigrationCreateInputSchema'
import { MigrationUncheckedCreateInputSchema } from '../inputTypeSchemas/MigrationUncheckedCreateInputSchema'
import { MigrationUpdateInputSchema } from '../inputTypeSchemas/MigrationUpdateInputSchema'
import { MigrationUncheckedUpdateInputSchema } from '../inputTypeSchemas/MigrationUncheckedUpdateInputSchema'
// Select schema needs to be in file to prevent circular imports
//------------------------------------------------------

export const MigrationSelectSchema: z.ZodType<Prisma.MigrationSelect> = z.object({
  id: z.boolean().optional(),
  name: z.boolean().optional(),
  executedAt: z.boolean().optional(),
}).strict()

export const MigrationUpsertArgsSchema: z.ZodType<Prisma.MigrationUpsertArgs> = z.object({
  select: MigrationSelectSchema.optional(),
  where: MigrationWhereUniqueInputSchema, 
  create: z.union([ MigrationCreateInputSchema, MigrationUncheckedCreateInputSchema ]),
  update: z.union([ MigrationUpdateInputSchema, MigrationUncheckedUpdateInputSchema ]),
}).strict();

export default MigrationUpsertArgsSchema;
