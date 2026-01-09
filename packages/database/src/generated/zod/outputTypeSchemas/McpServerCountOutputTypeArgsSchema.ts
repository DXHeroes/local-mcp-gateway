import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { McpServerCountOutputTypeSelectSchema } from './McpServerCountOutputTypeSelectSchema';

export const McpServerCountOutputTypeArgsSchema: z.ZodType<Prisma.McpServerCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => McpServerCountOutputTypeSelectSchema).nullish(),
}).strict();

export default McpServerCountOutputTypeSelectSchema;
