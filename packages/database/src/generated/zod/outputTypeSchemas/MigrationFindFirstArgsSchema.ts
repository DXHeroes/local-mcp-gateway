import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { MigrationWhereInputSchema } from '../inputTypeSchemas/MigrationWhereInputSchema'
import { MigrationOrderByWithRelationInputSchema } from '../inputTypeSchemas/MigrationOrderByWithRelationInputSchema'
import { MigrationWhereUniqueInputSchema } from '../inputTypeSchemas/MigrationWhereUniqueInputSchema'
import { MigrationScalarFieldEnumSchema } from '../inputTypeSchemas/MigrationScalarFieldEnumSchema'
// Select schema needs to be in file to prevent circular imports
//------------------------------------------------------

export const MigrationSelectSchema: z.ZodType<Prisma.MigrationSelect> = z.object({
  id: z.boolean().optional(),
  name: z.boolean().optional(),
  executedAt: z.boolean().optional(),
}).strict()

export const MigrationFindFirstArgsSchema: z.ZodType<Prisma.MigrationFindFirstArgs> = z.object({
  select: MigrationSelectSchema.optional(),
  where: MigrationWhereInputSchema.optional(), 
  orderBy: z.union([ MigrationOrderByWithRelationInputSchema.array(), MigrationOrderByWithRelationInputSchema ]).optional(),
  cursor: MigrationWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ MigrationScalarFieldEnumSchema, MigrationScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export default MigrationFindFirstArgsSchema;
