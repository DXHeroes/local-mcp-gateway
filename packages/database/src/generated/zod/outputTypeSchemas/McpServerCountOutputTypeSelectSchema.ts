import { z } from 'zod';
import type { Prisma } from '../../prisma';

export const McpServerCountOutputTypeSelectSchema: z.ZodType<Prisma.McpServerCountOutputTypeSelect> = z.object({
  profiles: z.boolean().optional(),
  oauthClientRegistrations: z.boolean().optional(),
  toolsCache: z.boolean().optional(),
  debugLogs: z.boolean().optional(),
}).strict();

export default McpServerCountOutputTypeSelectSchema;
