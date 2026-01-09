import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { MigrationWhereInputSchema } from '../inputTypeSchemas/MigrationWhereInputSchema'
import { MigrationOrderByWithAggregationInputSchema } from '../inputTypeSchemas/MigrationOrderByWithAggregationInputSchema'
import { MigrationScalarFieldEnumSchema } from '../inputTypeSchemas/MigrationScalarFieldEnumSchema'
import { MigrationScalarWhereWithAggregatesInputSchema } from '../inputTypeSchemas/MigrationScalarWhereWithAggregatesInputSchema'

export const MigrationGroupByArgsSchema: z.ZodType<Prisma.MigrationGroupByArgs> = z.object({
  where: MigrationWhereInputSchema.optional(), 
  orderBy: z.union([ MigrationOrderByWithAggregationInputSchema.array(), MigrationOrderByWithAggregationInputSchema ]).optional(),
  by: MigrationScalarFieldEnumSchema.array(), 
  having: MigrationScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export default MigrationGroupByArgsSchema;
