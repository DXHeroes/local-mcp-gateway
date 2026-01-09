import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { MigrationUpdateInputSchema } from '../inputTypeSchemas/MigrationUpdateInputSchema'
import { MigrationUncheckedUpdateInputSchema } from '../inputTypeSchemas/MigrationUncheckedUpdateInputSchema'
import { MigrationWhereUniqueInputSchema } from '../inputTypeSchemas/MigrationWhereUniqueInputSchema'
// Select schema needs to be in file to prevent circular imports
//------------------------------------------------------

export const MigrationSelectSchema: z.ZodType<Prisma.MigrationSelect> = z.object({
  id: z.boolean().optional(),
  name: z.boolean().optional(),
  executedAt: z.boolean().optional(),
}).strict()

export const MigrationUpdateArgsSchema: z.ZodType<Prisma.MigrationUpdateArgs> = z.object({
  select: MigrationSelectSchema.optional(),
  data: z.union([ MigrationUpdateInputSchema, MigrationUncheckedUpdateInputSchema ]),
  where: MigrationWhereUniqueInputSchema, 
}).strict();

export default MigrationUpdateArgsSchema;
