import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { MigrationCreateManyInputSchema } from '../inputTypeSchemas/MigrationCreateManyInputSchema'

export const MigrationCreateManyArgsSchema: z.ZodType<Prisma.MigrationCreateManyArgs> = z.object({
  data: z.union([ MigrationCreateManyInputSchema, MigrationCreateManyInputSchema.array() ]),
}).strict();

export default MigrationCreateManyArgsSchema;
