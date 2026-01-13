import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { ProfileMcpServerWhereInputSchema } from '../inputTypeSchemas/ProfileMcpServerWhereInputSchema'
import { ProfileMcpServerOrderByWithRelationInputSchema } from '../inputTypeSchemas/ProfileMcpServerOrderByWithRelationInputSchema'
import { ProfileMcpServerWhereUniqueInputSchema } from '../inputTypeSchemas/ProfileMcpServerWhereUniqueInputSchema'

export const ProfileMcpServerAggregateArgsSchema: z.ZodType<Prisma.ProfileMcpServerAggregateArgs> = z.object({
  where: ProfileMcpServerWhereInputSchema.optional(), 
  orderBy: z.union([ ProfileMcpServerOrderByWithRelationInputSchema.array(), ProfileMcpServerOrderByWithRelationInputSchema ]).optional(),
  cursor: ProfileMcpServerWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export default ProfileMcpServerAggregateArgsSchema;
