import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { DebugLogCreateWithoutMcpServerInputSchema } from './DebugLogCreateWithoutMcpServerInputSchema';
import { DebugLogUncheckedCreateWithoutMcpServerInputSchema } from './DebugLogUncheckedCreateWithoutMcpServerInputSchema';
import { DebugLogCreateOrConnectWithoutMcpServerInputSchema } from './DebugLogCreateOrConnectWithoutMcpServerInputSchema';
import { DebugLogCreateManyMcpServerInputEnvelopeSchema } from './DebugLogCreateManyMcpServerInputEnvelopeSchema';
import { DebugLogWhereUniqueInputSchema } from './DebugLogWhereUniqueInputSchema';

export const DebugLogUncheckedCreateNestedManyWithoutMcpServerInputSchema: z.ZodType<Prisma.DebugLogUncheckedCreateNestedManyWithoutMcpServerInput> = z.strictObject({
  create: z.union([ z.lazy(() => DebugLogCreateWithoutMcpServerInputSchema), z.lazy(() => DebugLogCreateWithoutMcpServerInputSchema).array(), z.lazy(() => DebugLogUncheckedCreateWithoutMcpServerInputSchema), z.lazy(() => DebugLogUncheckedCreateWithoutMcpServerInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => DebugLogCreateOrConnectWithoutMcpServerInputSchema), z.lazy(() => DebugLogCreateOrConnectWithoutMcpServerInputSchema).array() ]).optional(),
  createMany: z.lazy(() => DebugLogCreateManyMcpServerInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => DebugLogWhereUniqueInputSchema), z.lazy(() => DebugLogWhereUniqueInputSchema).array() ]).optional(),
});

export default DebugLogUncheckedCreateNestedManyWithoutMcpServerInputSchema;
