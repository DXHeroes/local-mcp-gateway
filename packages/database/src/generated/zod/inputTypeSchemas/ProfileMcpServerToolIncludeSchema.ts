import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { ProfileMcpServerArgsSchema } from "../outputTypeSchemas/ProfileMcpServerArgsSchema"

export const ProfileMcpServerToolIncludeSchema: z.ZodType<Prisma.ProfileMcpServerToolInclude> = z.object({
  profileMcpServer: z.union([z.boolean(),z.lazy(() => ProfileMcpServerArgsSchema)]).optional(),
}).strict();

export default ProfileMcpServerToolIncludeSchema;
