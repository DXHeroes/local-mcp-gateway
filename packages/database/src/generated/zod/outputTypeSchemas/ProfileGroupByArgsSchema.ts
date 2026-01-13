import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { ProfileWhereInputSchema } from '../inputTypeSchemas/ProfileWhereInputSchema'
import { ProfileOrderByWithAggregationInputSchema } from '../inputTypeSchemas/ProfileOrderByWithAggregationInputSchema'
import { ProfileScalarFieldEnumSchema } from '../inputTypeSchemas/ProfileScalarFieldEnumSchema'
import { ProfileScalarWhereWithAggregatesInputSchema } from '../inputTypeSchemas/ProfileScalarWhereWithAggregatesInputSchema'

export const ProfileGroupByArgsSchema: z.ZodType<Prisma.ProfileGroupByArgs> = z.object({
  where: ProfileWhereInputSchema.optional(), 
  orderBy: z.union([ ProfileOrderByWithAggregationInputSchema.array(), ProfileOrderByWithAggregationInputSchema ]).optional(),
  by: ProfileScalarFieldEnumSchema.array(), 
  having: ProfileScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export default ProfileGroupByArgsSchema;
