import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { MigrationWhereUniqueInputSchema } from '../inputTypeSchemas/MigrationWhereUniqueInputSchema'
// Select schema needs to be in file to prevent circular imports
//------------------------------------------------------

export const MigrationSelectSchema: z.ZodType<Prisma.MigrationSelect> = z.object({
  id: z.boolean().optional(),
  name: z.boolean().optional(),
  executedAt: z.boolean().optional(),
}).strict()

export const MigrationFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.MigrationFindUniqueOrThrowArgs> = z.object({
  select: MigrationSelectSchema.optional(),
  where: MigrationWhereUniqueInputSchema, 
}).strict();

export default MigrationFindUniqueOrThrowArgsSchema;
