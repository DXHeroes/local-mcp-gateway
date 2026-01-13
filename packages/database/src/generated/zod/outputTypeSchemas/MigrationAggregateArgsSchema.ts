import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { MigrationWhereInputSchema } from '../inputTypeSchemas/MigrationWhereInputSchema'
import { MigrationOrderByWithRelationInputSchema } from '../inputTypeSchemas/MigrationOrderByWithRelationInputSchema'
import { MigrationWhereUniqueInputSchema } from '../inputTypeSchemas/MigrationWhereUniqueInputSchema'

export const MigrationAggregateArgsSchema: z.ZodType<Prisma.MigrationAggregateArgs> = z.object({
  where: MigrationWhereInputSchema.optional(), 
  orderBy: z.union([ MigrationOrderByWithRelationInputSchema.array(), MigrationOrderByWithRelationInputSchema ]).optional(),
  cursor: MigrationWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export default MigrationAggregateArgsSchema;
