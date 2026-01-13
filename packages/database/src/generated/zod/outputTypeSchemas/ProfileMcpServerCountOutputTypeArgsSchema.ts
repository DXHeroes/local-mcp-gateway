import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { ProfileMcpServerCountOutputTypeSelectSchema } from './ProfileMcpServerCountOutputTypeSelectSchema';

export const ProfileMcpServerCountOutputTypeArgsSchema: z.ZodType<Prisma.ProfileMcpServerCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => ProfileMcpServerCountOutputTypeSelectSchema).nullish(),
}).strict();

export default ProfileMcpServerCountOutputTypeSelectSchema;
