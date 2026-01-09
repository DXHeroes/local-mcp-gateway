import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { MigrationCreateManyInputSchema } from '../inputTypeSchemas/MigrationCreateManyInputSchema'

export const MigrationCreateManyAndReturnArgsSchema: z.ZodType<Prisma.MigrationCreateManyAndReturnArgs> = z.object({
  data: z.union([ MigrationCreateManyInputSchema, MigrationCreateManyInputSchema.array() ]),
}).strict();

export default MigrationCreateManyAndReturnArgsSchema;
