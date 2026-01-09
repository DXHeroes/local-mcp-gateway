import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { DebugLogWhereUniqueInputSchema } from './DebugLogWhereUniqueInputSchema';
import { DebugLogCreateWithoutProfileInputSchema } from './DebugLogCreateWithoutProfileInputSchema';
import { DebugLogUncheckedCreateWithoutProfileInputSchema } from './DebugLogUncheckedCreateWithoutProfileInputSchema';

export const DebugLogCreateOrConnectWithoutProfileInputSchema: z.ZodType<Prisma.DebugLogCreateOrConnectWithoutProfileInput> = z.strictObject({
  where: z.lazy(() => DebugLogWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => DebugLogCreateWithoutProfileInputSchema), z.lazy(() => DebugLogUncheckedCreateWithoutProfileInputSchema) ]),
});

export default DebugLogCreateOrConnectWithoutProfileInputSchema;
