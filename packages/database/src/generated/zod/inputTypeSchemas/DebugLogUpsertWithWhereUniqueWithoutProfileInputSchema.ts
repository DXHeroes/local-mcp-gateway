import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { DebugLogWhereUniqueInputSchema } from './DebugLogWhereUniqueInputSchema';
import { DebugLogUpdateWithoutProfileInputSchema } from './DebugLogUpdateWithoutProfileInputSchema';
import { DebugLogUncheckedUpdateWithoutProfileInputSchema } from './DebugLogUncheckedUpdateWithoutProfileInputSchema';
import { DebugLogCreateWithoutProfileInputSchema } from './DebugLogCreateWithoutProfileInputSchema';
import { DebugLogUncheckedCreateWithoutProfileInputSchema } from './DebugLogUncheckedCreateWithoutProfileInputSchema';

export const DebugLogUpsertWithWhereUniqueWithoutProfileInputSchema: z.ZodType<Prisma.DebugLogUpsertWithWhereUniqueWithoutProfileInput> = z.strictObject({
  where: z.lazy(() => DebugLogWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => DebugLogUpdateWithoutProfileInputSchema), z.lazy(() => DebugLogUncheckedUpdateWithoutProfileInputSchema) ]),
  create: z.union([ z.lazy(() => DebugLogCreateWithoutProfileInputSchema), z.lazy(() => DebugLogUncheckedCreateWithoutProfileInputSchema) ]),
});

export default DebugLogUpsertWithWhereUniqueWithoutProfileInputSchema;
