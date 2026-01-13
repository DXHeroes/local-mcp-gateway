import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { DebugLogWhereUniqueInputSchema } from './DebugLogWhereUniqueInputSchema';
import { DebugLogUpdateWithoutMcpServerInputSchema } from './DebugLogUpdateWithoutMcpServerInputSchema';
import { DebugLogUncheckedUpdateWithoutMcpServerInputSchema } from './DebugLogUncheckedUpdateWithoutMcpServerInputSchema';
import { DebugLogCreateWithoutMcpServerInputSchema } from './DebugLogCreateWithoutMcpServerInputSchema';
import { DebugLogUncheckedCreateWithoutMcpServerInputSchema } from './DebugLogUncheckedCreateWithoutMcpServerInputSchema';

export const DebugLogUpsertWithWhereUniqueWithoutMcpServerInputSchema: z.ZodType<Prisma.DebugLogUpsertWithWhereUniqueWithoutMcpServerInput> = z.strictObject({
  where: z.lazy(() => DebugLogWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => DebugLogUpdateWithoutMcpServerInputSchema), z.lazy(() => DebugLogUncheckedUpdateWithoutMcpServerInputSchema) ]),
  create: z.union([ z.lazy(() => DebugLogCreateWithoutMcpServerInputSchema), z.lazy(() => DebugLogUncheckedCreateWithoutMcpServerInputSchema) ]),
});

export default DebugLogUpsertWithWhereUniqueWithoutMcpServerInputSchema;
