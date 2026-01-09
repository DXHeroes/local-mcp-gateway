import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { ProfileMcpServerWhereInputSchema } from '../inputTypeSchemas/ProfileMcpServerWhereInputSchema'
import { ProfileMcpServerOrderByWithAggregationInputSchema } from '../inputTypeSchemas/ProfileMcpServerOrderByWithAggregationInputSchema'
import { ProfileMcpServerScalarFieldEnumSchema } from '../inputTypeSchemas/ProfileMcpServerScalarFieldEnumSchema'
import { ProfileMcpServerScalarWhereWithAggregatesInputSchema } from '../inputTypeSchemas/ProfileMcpServerScalarWhereWithAggregatesInputSchema'

export const ProfileMcpServerGroupByArgsSchema: z.ZodType<Prisma.ProfileMcpServerGroupByArgs> = z.object({
  where: ProfileMcpServerWhereInputSchema.optional(), 
  orderBy: z.union([ ProfileMcpServerOrderByWithAggregationInputSchema.array(), ProfileMcpServerOrderByWithAggregationInputSchema ]).optional(),
  by: ProfileMcpServerScalarFieldEnumSchema.array(), 
  having: ProfileMcpServerScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export default ProfileMcpServerGroupByArgsSchema;
