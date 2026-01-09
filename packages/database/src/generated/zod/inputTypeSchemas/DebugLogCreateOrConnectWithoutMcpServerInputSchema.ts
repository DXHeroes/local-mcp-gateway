import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { DebugLogWhereUniqueInputSchema } from './DebugLogWhereUniqueInputSchema';
import { DebugLogCreateWithoutMcpServerInputSchema } from './DebugLogCreateWithoutMcpServerInputSchema';
import { DebugLogUncheckedCreateWithoutMcpServerInputSchema } from './DebugLogUncheckedCreateWithoutMcpServerInputSchema';

export const DebugLogCreateOrConnectWithoutMcpServerInputSchema: z.ZodType<Prisma.DebugLogCreateOrConnectWithoutMcpServerInput> = z.strictObject({
  where: z.lazy(() => DebugLogWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => DebugLogCreateWithoutMcpServerInputSchema), z.lazy(() => DebugLogUncheckedCreateWithoutMcpServerInputSchema) ]),
});

export default DebugLogCreateOrConnectWithoutMcpServerInputSchema;
