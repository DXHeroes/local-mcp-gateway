import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { MigrationWhereInputSchema } from '../inputTypeSchemas/MigrationWhereInputSchema'

export const MigrationDeleteManyArgsSchema: z.ZodType<Prisma.MigrationDeleteManyArgs> = z.object({
  where: MigrationWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export default MigrationDeleteManyArgsSchema;
