import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { DebugLogCreateWithoutProfileInputSchema } from './DebugLogCreateWithoutProfileInputSchema';
import { DebugLogUncheckedCreateWithoutProfileInputSchema } from './DebugLogUncheckedCreateWithoutProfileInputSchema';
import { DebugLogCreateOrConnectWithoutProfileInputSchema } from './DebugLogCreateOrConnectWithoutProfileInputSchema';
import { DebugLogCreateManyProfileInputEnvelopeSchema } from './DebugLogCreateManyProfileInputEnvelopeSchema';
import { DebugLogWhereUniqueInputSchema } from './DebugLogWhereUniqueInputSchema';

export const DebugLogCreateNestedManyWithoutProfileInputSchema: z.ZodType<Prisma.DebugLogCreateNestedManyWithoutProfileInput> = z.strictObject({
  create: z.union([ z.lazy(() => DebugLogCreateWithoutProfileInputSchema), z.lazy(() => DebugLogCreateWithoutProfileInputSchema).array(), z.lazy(() => DebugLogUncheckedCreateWithoutProfileInputSchema), z.lazy(() => DebugLogUncheckedCreateWithoutProfileInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => DebugLogCreateOrConnectWithoutProfileInputSchema), z.lazy(() => DebugLogCreateOrConnectWithoutProfileInputSchema).array() ]).optional(),
  createMany: z.lazy(() => DebugLogCreateManyProfileInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => DebugLogWhereUniqueInputSchema), z.lazy(() => DebugLogWhereUniqueInputSchema).array() ]).optional(),
});

export default DebugLogCreateNestedManyWithoutProfileInputSchema;
