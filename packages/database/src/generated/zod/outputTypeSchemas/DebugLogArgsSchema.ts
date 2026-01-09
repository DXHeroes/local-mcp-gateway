import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { DebugLogSelectSchema } from '../inputTypeSchemas/DebugLogSelectSchema';
import { DebugLogIncludeSchema } from '../inputTypeSchemas/DebugLogIncludeSchema';

export const DebugLogArgsSchema: z.ZodType<Prisma.DebugLogDefaultArgs> = z.object({
  select: z.lazy(() => DebugLogSelectSchema).optional(),
  include: z.lazy(() => DebugLogIncludeSchema).optional(),
}).strict();

export default DebugLogArgsSchema;
