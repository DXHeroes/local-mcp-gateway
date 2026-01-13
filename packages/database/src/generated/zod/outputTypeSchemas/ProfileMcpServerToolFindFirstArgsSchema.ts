import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { ProfileMcpServerToolIncludeSchema } from '../inputTypeSchemas/ProfileMcpServerToolIncludeSchema'
import { ProfileMcpServerToolWhereInputSchema } from '../inputTypeSchemas/ProfileMcpServerToolWhereInputSchema'
import { ProfileMcpServerToolOrderByWithRelationInputSchema } from '../inputTypeSchemas/ProfileMcpServerToolOrderByWithRelationInputSchema'
import { ProfileMcpServerToolWhereUniqueInputSchema } from '../inputTypeSchemas/ProfileMcpServerToolWhereUniqueInputSchema'
import { ProfileMcpServerToolScalarFieldEnumSchema } from '../inputTypeSchemas/ProfileMcpServerToolScalarFieldEnumSchema'
import { ProfileMcpServerArgsSchema } from "../outputTypeSchemas/ProfileMcpServerArgsSchema"
// Select schema needs to be in file to prevent circular imports
//------------------------------------------------------

export const ProfileMcpServerToolSelectSchema: z.ZodType<Prisma.ProfileMcpServerToolSelect> = z.object({
  id: z.boolean().optional(),
  profileMcpServerId: z.boolean().optional(),
  toolName: z.boolean().optional(),
  isEnabled: z.boolean().optional(),
  customName: z.boolean().optional(),
  customDescription: z.boolean().optional(),
  customInputSchema: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  profileMcpServer: z.union([z.boolean(),z.lazy(() => ProfileMcpServerArgsSchema)]).optional(),
}).strict()

export const ProfileMcpServerToolFindFirstArgsSchema: z.ZodType<Prisma.ProfileMcpServerToolFindFirstArgs> = z.object({
  select: ProfileMcpServerToolSelectSchema.optional(),
  include: z.lazy(() => ProfileMcpServerToolIncludeSchema).optional(),
  where: ProfileMcpServerToolWhereInputSchema.optional(), 
  orderBy: z.union([ ProfileMcpServerToolOrderByWithRelationInputSchema.array(), ProfileMcpServerToolOrderByWithRelationInputSchema ]).optional(),
  cursor: ProfileMcpServerToolWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ProfileMcpServerToolScalarFieldEnumSchema, ProfileMcpServerToolScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export default ProfileMcpServerToolFindFirstArgsSchema;
