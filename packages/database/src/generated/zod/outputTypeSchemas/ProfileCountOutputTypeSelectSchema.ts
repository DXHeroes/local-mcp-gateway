import { z } from 'zod';
import type { Prisma } from '../../prisma';

export const ProfileCountOutputTypeSelectSchema: z.ZodType<Prisma.ProfileCountOutputTypeSelect> = z.object({
  mcpServers: z.boolean().optional(),
  debugLogs: z.boolean().optional(),
}).strict();

export default ProfileCountOutputTypeSelectSchema;
