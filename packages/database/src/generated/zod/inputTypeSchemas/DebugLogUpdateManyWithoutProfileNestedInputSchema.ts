import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { DebugLogCreateWithoutProfileInputSchema } from './DebugLogCreateWithoutProfileInputSchema';
import { DebugLogUncheckedCreateWithoutProfileInputSchema } from './DebugLogUncheckedCreateWithoutProfileInputSchema';
import { DebugLogCreateOrConnectWithoutProfileInputSchema } from './DebugLogCreateOrConnectWithoutProfileInputSchema';
import { DebugLogUpsertWithWhereUniqueWithoutProfileInputSchema } from './DebugLogUpsertWithWhereUniqueWithoutProfileInputSchema';
import { DebugLogCreateManyProfileInputEnvelopeSchema } from './DebugLogCreateManyProfileInputEnvelopeSchema';
import { DebugLogWhereUniqueInputSchema } from './DebugLogWhereUniqueInputSchema';
import { DebugLogUpdateWithWhereUniqueWithoutProfileInputSchema } from './DebugLogUpdateWithWhereUniqueWithoutProfileInputSchema';
import { DebugLogUpdateManyWithWhereWithoutProfileInputSchema } from './DebugLogUpdateManyWithWhereWithoutProfileInputSchema';
import { DebugLogScalarWhereInputSchema } from './DebugLogScalarWhereInputSchema';

export const DebugLogUpdateManyWithoutProfileNestedInputSchema: z.ZodType<Prisma.DebugLogUpdateManyWithoutProfileNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => DebugLogCreateWithoutProfileInputSchema), z.lazy(() => DebugLogCreateWithoutProfileInputSchema).array(), z.lazy(() => DebugLogUncheckedCreateWithoutProfileInputSchema), z.lazy(() => DebugLogUncheckedCreateWithoutProfileInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => DebugLogCreateOrConnectWithoutProfileInputSchema), z.lazy(() => DebugLogCreateOrConnectWithoutProfileInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => DebugLogUpsertWithWhereUniqueWithoutProfileInputSchema), z.lazy(() => DebugLogUpsertWithWhereUniqueWithoutProfileInputSchema).array() ]).optional(),
  createMany: z.lazy(() => DebugLogCreateManyProfileInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => DebugLogWhereUniqueInputSchema), z.lazy(() => DebugLogWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => DebugLogWhereUniqueInputSchema), z.lazy(() => DebugLogWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => DebugLogWhereUniqueInputSchema), z.lazy(() => DebugLogWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => DebugLogWhereUniqueInputSchema), z.lazy(() => DebugLogWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => DebugLogUpdateWithWhereUniqueWithoutProfileInputSchema), z.lazy(() => DebugLogUpdateWithWhereUniqueWithoutProfileInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => DebugLogUpdateManyWithWhereWithoutProfileInputSchema), z.lazy(() => DebugLogUpdateManyWithWhereWithoutProfileInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => DebugLogScalarWhereInputSchema), z.lazy(() => DebugLogScalarWhereInputSchema).array() ]).optional(),
});

export default DebugLogUpdateManyWithoutProfileNestedInputSchema;
