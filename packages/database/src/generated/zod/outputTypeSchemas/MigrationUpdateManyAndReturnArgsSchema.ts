import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { MigrationUpdateManyMutationInputSchema } from '../inputTypeSchemas/MigrationUpdateManyMutationInputSchema'
import { MigrationUncheckedUpdateManyInputSchema } from '../inputTypeSchemas/MigrationUncheckedUpdateManyInputSchema'
import { MigrationWhereInputSchema } from '../inputTypeSchemas/MigrationWhereInputSchema'

export const MigrationUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.MigrationUpdateManyAndReturnArgs> = z.object({
  data: z.union([ MigrationUpdateManyMutationInputSchema, MigrationUncheckedUpdateManyInputSchema ]),
  where: MigrationWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export default MigrationUpdateManyAndReturnArgsSchema;
