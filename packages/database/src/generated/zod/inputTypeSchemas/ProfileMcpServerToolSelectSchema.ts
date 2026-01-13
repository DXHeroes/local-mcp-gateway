import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { ProfileMcpServerArgsSchema } from "../outputTypeSchemas/ProfileMcpServerArgsSchema"

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

export default ProfileMcpServerToolSelectSchema;
