import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { ProfileMcpServerIncludeSchema } from '../inputTypeSchemas/ProfileMcpServerIncludeSchema'
import { ProfileMcpServerWhereInputSchema } from '../inputTypeSchemas/ProfileMcpServerWhereInputSchema'
import { ProfileMcpServerOrderByWithRelationInputSchema } from '../inputTypeSchemas/ProfileMcpServerOrderByWithRelationInputSchema'
import { ProfileMcpServerWhereUniqueInputSchema } from '../inputTypeSchemas/ProfileMcpServerWhereUniqueInputSchema'
import { ProfileMcpServerScalarFieldEnumSchema } from '../inputTypeSchemas/ProfileMcpServerScalarFieldEnumSchema'
import { ProfileArgsSchema } from "../outputTypeSchemas/ProfileArgsSchema"
import { McpServerArgsSchema } from "../outputTypeSchemas/McpServerArgsSchema"
import { ProfileMcpServerToolFindManyArgsSchema } from "../outputTypeSchemas/ProfileMcpServerToolFindManyArgsSchema"
import { ProfileMcpServerCountOutputTypeArgsSchema } from "../outputTypeSchemas/ProfileMcpServerCountOutputTypeArgsSchema"
// Select schema needs to be in file to prevent circular imports
//------------------------------------------------------

export const ProfileMcpServerSelectSchema: z.ZodType<Prisma.ProfileMcpServerSelect> = z.object({
  id: z.boolean().optional(),
  profileId: z.boolean().optional(),
  mcpServerId: z.boolean().optional(),
  order: z.boolean().optional(),
  isActive: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  profile: z.union([z.boolean(),z.lazy(() => ProfileArgsSchema)]).optional(),
  mcpServer: z.union([z.boolean(),z.lazy(() => McpServerArgsSchema)]).optional(),
  tools: z.union([z.boolean(),z.lazy(() => ProfileMcpServerToolFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => ProfileMcpServerCountOutputTypeArgsSchema)]).optional(),
}).strict()

export const ProfileMcpServerFindFirstOrThrowArgsSchema: z.ZodType<Prisma.ProfileMcpServerFindFirstOrThrowArgs> = z.object({
  select: ProfileMcpServerSelectSchema.optional(),
  include: z.lazy(() => ProfileMcpServerIncludeSchema).optional(),
  where: ProfileMcpServerWhereInputSchema.optional(), 
  orderBy: z.union([ ProfileMcpServerOrderByWithRelationInputSchema.array(), ProfileMcpServerOrderByWithRelationInputSchema ]).optional(),
  cursor: ProfileMcpServerWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ProfileMcpServerScalarFieldEnumSchema, ProfileMcpServerScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export default ProfileMcpServerFindFirstOrThrowArgsSchema;
