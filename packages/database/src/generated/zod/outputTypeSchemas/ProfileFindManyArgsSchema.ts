import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { ProfileIncludeSchema } from '../inputTypeSchemas/ProfileIncludeSchema'
import { ProfileWhereInputSchema } from '../inputTypeSchemas/ProfileWhereInputSchema'
import { ProfileOrderByWithRelationInputSchema } from '../inputTypeSchemas/ProfileOrderByWithRelationInputSchema'
import { ProfileWhereUniqueInputSchema } from '../inputTypeSchemas/ProfileWhereUniqueInputSchema'
import { ProfileScalarFieldEnumSchema } from '../inputTypeSchemas/ProfileScalarFieldEnumSchema'
import { ProfileMcpServerFindManyArgsSchema } from "../outputTypeSchemas/ProfileMcpServerFindManyArgsSchema"
import { DebugLogFindManyArgsSchema } from "../outputTypeSchemas/DebugLogFindManyArgsSchema"
import { ProfileCountOutputTypeArgsSchema } from "../outputTypeSchemas/ProfileCountOutputTypeArgsSchema"
// Select schema needs to be in file to prevent circular imports
//------------------------------------------------------

export const ProfileSelectSchema: z.ZodType<Prisma.ProfileSelect> = z.object({
  id: z.boolean().optional(),
  name: z.boolean().optional(),
  description: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  mcpServers: z.union([z.boolean(),z.lazy(() => ProfileMcpServerFindManyArgsSchema)]).optional(),
  debugLogs: z.union([z.boolean(),z.lazy(() => DebugLogFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => ProfileCountOutputTypeArgsSchema)]).optional(),
}).strict()

export const ProfileFindManyArgsSchema: z.ZodType<Prisma.ProfileFindManyArgs> = z.object({
  select: ProfileSelectSchema.optional(),
  include: z.lazy(() => ProfileIncludeSchema).optional(),
  where: ProfileWhereInputSchema.optional(), 
  orderBy: z.union([ ProfileOrderByWithRelationInputSchema.array(), ProfileOrderByWithRelationInputSchema ]).optional(),
  cursor: ProfileWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ ProfileScalarFieldEnumSchema, ProfileScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export default ProfileFindManyArgsSchema;
