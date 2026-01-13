import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { ProfileMcpServerToolIncludeSchema } from '../inputTypeSchemas/ProfileMcpServerToolIncludeSchema'
import { ProfileMcpServerToolCreateInputSchema } from '../inputTypeSchemas/ProfileMcpServerToolCreateInputSchema'
import { ProfileMcpServerToolUncheckedCreateInputSchema } from '../inputTypeSchemas/ProfileMcpServerToolUncheckedCreateInputSchema'
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

export const ProfileMcpServerToolCreateArgsSchema: z.ZodType<Prisma.ProfileMcpServerToolCreateArgs> = z.object({
  select: ProfileMcpServerToolSelectSchema.optional(),
  include: z.lazy(() => ProfileMcpServerToolIncludeSchema).optional(),
  data: z.union([ ProfileMcpServerToolCreateInputSchema, ProfileMcpServerToolUncheckedCreateInputSchema ]),
}).strict();

export default ProfileMcpServerToolCreateArgsSchema;
