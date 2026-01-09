import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { ProfileMcpServerSelectSchema } from '../inputTypeSchemas/ProfileMcpServerSelectSchema';
import { ProfileMcpServerIncludeSchema } from '../inputTypeSchemas/ProfileMcpServerIncludeSchema';

export const ProfileMcpServerArgsSchema: z.ZodType<Prisma.ProfileMcpServerDefaultArgs> = z.object({
  select: z.lazy(() => ProfileMcpServerSelectSchema).optional(),
  include: z.lazy(() => ProfileMcpServerIncludeSchema).optional(),
}).strict();

export default ProfileMcpServerArgsSchema;
