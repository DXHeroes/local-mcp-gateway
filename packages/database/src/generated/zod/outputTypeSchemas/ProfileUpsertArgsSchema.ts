import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { ProfileIncludeSchema } from '../inputTypeSchemas/ProfileIncludeSchema'
import { ProfileWhereUniqueInputSchema } from '../inputTypeSchemas/ProfileWhereUniqueInputSchema'
import { ProfileCreateInputSchema } from '../inputTypeSchemas/ProfileCreateInputSchema'
import { ProfileUncheckedCreateInputSchema } from '../inputTypeSchemas/ProfileUncheckedCreateInputSchema'
import { ProfileUpdateInputSchema } from '../inputTypeSchemas/ProfileUpdateInputSchema'
import { ProfileUncheckedUpdateInputSchema } from '../inputTypeSchemas/ProfileUncheckedUpdateInputSchema'
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

export const ProfileUpsertArgsSchema: z.ZodType<Prisma.ProfileUpsertArgs> = z.object({
  select: ProfileSelectSchema.optional(),
  include: z.lazy(() => ProfileIncludeSchema).optional(),
  where: ProfileWhereUniqueInputSchema, 
  create: z.union([ ProfileCreateInputSchema, ProfileUncheckedCreateInputSchema ]),
  update: z.union([ ProfileUpdateInputSchema, ProfileUncheckedUpdateInputSchema ]),
}).strict();

export default ProfileUpsertArgsSchema;
