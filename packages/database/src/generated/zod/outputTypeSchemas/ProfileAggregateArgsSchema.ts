import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { ProfileWhereInputSchema } from '../inputTypeSchemas/ProfileWhereInputSchema'
import { ProfileOrderByWithRelationInputSchema } from '../inputTypeSchemas/ProfileOrderByWithRelationInputSchema'
import { ProfileWhereUniqueInputSchema } from '../inputTypeSchemas/ProfileWhereUniqueInputSchema'

export const ProfileAggregateArgsSchema: z.ZodType<Prisma.ProfileAggregateArgs> = z.object({
  where: ProfileWhereInputSchema.optional(), 
  orderBy: z.union([ ProfileOrderByWithRelationInputSchema.array(), ProfileOrderByWithRelationInputSchema ]).optional(),
  cursor: ProfileWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export default ProfileAggregateArgsSchema;
