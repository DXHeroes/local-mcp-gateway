import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { ProfileSelectSchema } from '../inputTypeSchemas/ProfileSelectSchema';
import { ProfileIncludeSchema } from '../inputTypeSchemas/ProfileIncludeSchema';

export const ProfileArgsSchema: z.ZodType<Prisma.ProfileDefaultArgs> = z.object({
  select: z.lazy(() => ProfileSelectSchema).optional(),
  include: z.lazy(() => ProfileIncludeSchema).optional(),
}).strict();

export default ProfileArgsSchema;
