import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { ProfileMcpServerToolSelectSchema } from '../inputTypeSchemas/ProfileMcpServerToolSelectSchema';
import { ProfileMcpServerToolIncludeSchema } from '../inputTypeSchemas/ProfileMcpServerToolIncludeSchema';

export const ProfileMcpServerToolArgsSchema: z.ZodType<Prisma.ProfileMcpServerToolDefaultArgs> = z.object({
  select: z.lazy(() => ProfileMcpServerToolSelectSchema).optional(),
  include: z.lazy(() => ProfileMcpServerToolIncludeSchema).optional(),
}).strict();

export default ProfileMcpServerToolArgsSchema;
