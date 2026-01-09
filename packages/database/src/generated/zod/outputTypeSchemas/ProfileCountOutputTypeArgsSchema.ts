import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { ProfileCountOutputTypeSelectSchema } from './ProfileCountOutputTypeSelectSchema';

export const ProfileCountOutputTypeArgsSchema: z.ZodType<Prisma.ProfileCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => ProfileCountOutputTypeSelectSchema).nullish(),
}).strict();

export default ProfileCountOutputTypeSelectSchema;
