import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { ProfileMcpServerToolWhereInputSchema } from '../inputTypeSchemas/ProfileMcpServerToolWhereInputSchema'
import { ProfileMcpServerToolOrderByWithRelationInputSchema } from '../inputTypeSchemas/ProfileMcpServerToolOrderByWithRelationInputSchema'
import { ProfileMcpServerToolWhereUniqueInputSchema } from '../inputTypeSchemas/ProfileMcpServerToolWhereUniqueInputSchema'

export const ProfileMcpServerToolAggregateArgsSchema: z.ZodType<Prisma.ProfileMcpServerToolAggregateArgs> = z.object({
  where: ProfileMcpServerToolWhereInputSchema.optional(), 
  orderBy: z.union([ ProfileMcpServerToolOrderByWithRelationInputSchema.array(), ProfileMcpServerToolOrderByWithRelationInputSchema ]).optional(),
  cursor: ProfileMcpServerToolWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export default ProfileMcpServerToolAggregateArgsSchema;
