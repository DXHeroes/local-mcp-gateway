import { z } from 'zod';
import type { Prisma } from '../../prisma';

export const ProfileMcpServerCountOutputTypeSelectSchema: z.ZodType<Prisma.ProfileMcpServerCountOutputTypeSelect> = z.object({
  tools: z.boolean().optional(),
}).strict();

export default ProfileMcpServerCountOutputTypeSelectSchema;
