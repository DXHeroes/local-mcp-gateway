import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { ProfileMcpServerToolWhereInputSchema } from '../inputTypeSchemas/ProfileMcpServerToolWhereInputSchema'
import { ProfileMcpServerToolOrderByWithAggregationInputSchema } from '../inputTypeSchemas/ProfileMcpServerToolOrderByWithAggregationInputSchema'
import { ProfileMcpServerToolScalarFieldEnumSchema } from '../inputTypeSchemas/ProfileMcpServerToolScalarFieldEnumSchema'
import { ProfileMcpServerToolScalarWhereWithAggregatesInputSchema } from '../inputTypeSchemas/ProfileMcpServerToolScalarWhereWithAggregatesInputSchema'

export const ProfileMcpServerToolGroupByArgsSchema: z.ZodType<Prisma.ProfileMcpServerToolGroupByArgs> = z.object({
  where: ProfileMcpServerToolWhereInputSchema.optional(), 
  orderBy: z.union([ ProfileMcpServerToolOrderByWithAggregationInputSchema.array(), ProfileMcpServerToolOrderByWithAggregationInputSchema ]).optional(),
  by: ProfileMcpServerToolScalarFieldEnumSchema.array(), 
  having: ProfileMcpServerToolScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export default ProfileMcpServerToolGroupByArgsSchema;
