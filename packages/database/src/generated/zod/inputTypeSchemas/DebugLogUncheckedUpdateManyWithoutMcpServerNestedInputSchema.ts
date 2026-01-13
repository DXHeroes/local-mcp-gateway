import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { DebugLogCreateWithoutMcpServerInputSchema } from './DebugLogCreateWithoutMcpServerInputSchema';
import { DebugLogUncheckedCreateWithoutMcpServerInputSchema } from './DebugLogUncheckedCreateWithoutMcpServerInputSchema';
import { DebugLogCreateOrConnectWithoutMcpServerInputSchema } from './DebugLogCreateOrConnectWithoutMcpServerInputSchema';
import { DebugLogUpsertWithWhereUniqueWithoutMcpServerInputSchema } from './DebugLogUpsertWithWhereUniqueWithoutMcpServerInputSchema';
import { DebugLogCreateManyMcpServerInputEnvelopeSchema } from './DebugLogCreateManyMcpServerInputEnvelopeSchema';
import { DebugLogWhereUniqueInputSchema } from './DebugLogWhereUniqueInputSchema';
import { DebugLogUpdateWithWhereUniqueWithoutMcpServerInputSchema } from './DebugLogUpdateWithWhereUniqueWithoutMcpServerInputSchema';
import { DebugLogUpdateManyWithWhereWithoutMcpServerInputSchema } from './DebugLogUpdateManyWithWhereWithoutMcpServerInputSchema';
import { DebugLogScalarWhereInputSchema } from './DebugLogScalarWhereInputSchema';

export const DebugLogUncheckedUpdateManyWithoutMcpServerNestedInputSchema: z.ZodType<Prisma.DebugLogUncheckedUpdateManyWithoutMcpServerNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => DebugLogCreateWithoutMcpServerInputSchema), z.lazy(() => DebugLogCreateWithoutMcpServerInputSchema).array(), z.lazy(() => DebugLogUncheckedCreateWithoutMcpServerInputSchema), z.lazy(() => DebugLogUncheckedCreateWithoutMcpServerInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => DebugLogCreateOrConnectWithoutMcpServerInputSchema), z.lazy(() => DebugLogCreateOrConnectWithoutMcpServerInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => DebugLogUpsertWithWhereUniqueWithoutMcpServerInputSchema), z.lazy(() => DebugLogUpsertWithWhereUniqueWithoutMcpServerInputSchema).array() ]).optional(),
  createMany: z.lazy(() => DebugLogCreateManyMcpServerInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => DebugLogWhereUniqueInputSchema), z.lazy(() => DebugLogWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => DebugLogWhereUniqueInputSchema), z.lazy(() => DebugLogWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => DebugLogWhereUniqueInputSchema), z.lazy(() => DebugLogWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => DebugLogWhereUniqueInputSchema), z.lazy(() => DebugLogWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => DebugLogUpdateWithWhereUniqueWithoutMcpServerInputSchema), z.lazy(() => DebugLogUpdateWithWhereUniqueWithoutMcpServerInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => DebugLogUpdateManyWithWhereWithoutMcpServerInputSchema), z.lazy(() => DebugLogUpdateManyWithWhereWithoutMcpServerInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => DebugLogScalarWhereInputSchema), z.lazy(() => DebugLogScalarWhereInputSchema).array() ]).optional(),
});

export default DebugLogUncheckedUpdateManyWithoutMcpServerNestedInputSchema;
