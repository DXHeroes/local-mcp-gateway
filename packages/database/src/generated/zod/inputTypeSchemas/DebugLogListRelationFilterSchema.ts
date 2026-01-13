import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { DebugLogWhereInputSchema } from './DebugLogWhereInputSchema';

export const DebugLogListRelationFilterSchema: z.ZodType<Prisma.DebugLogListRelationFilter> = z.strictObject({
  every: z.lazy(() => DebugLogWhereInputSchema).optional(),
  some: z.lazy(() => DebugLogWhereInputSchema).optional(),
  none: z.lazy(() => DebugLogWhereInputSchema).optional(),
});

export default DebugLogListRelationFilterSchema;
