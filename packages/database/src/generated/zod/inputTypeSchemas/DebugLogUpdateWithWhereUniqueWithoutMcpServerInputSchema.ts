import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { DebugLogWhereUniqueInputSchema } from './DebugLogWhereUniqueInputSchema';
import { DebugLogUpdateWithoutMcpServerInputSchema } from './DebugLogUpdateWithoutMcpServerInputSchema';
import { DebugLogUncheckedUpdateWithoutMcpServerInputSchema } from './DebugLogUncheckedUpdateWithoutMcpServerInputSchema';

export const DebugLogUpdateWithWhereUniqueWithoutMcpServerInputSchema: z.ZodType<Prisma.DebugLogUpdateWithWhereUniqueWithoutMcpServerInput> = z.strictObject({
  where: z.lazy(() => DebugLogWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => DebugLogUpdateWithoutMcpServerInputSchema), z.lazy(() => DebugLogUncheckedUpdateWithoutMcpServerInputSchema) ]),
});

export default DebugLogUpdateWithWhereUniqueWithoutMcpServerInputSchema;
