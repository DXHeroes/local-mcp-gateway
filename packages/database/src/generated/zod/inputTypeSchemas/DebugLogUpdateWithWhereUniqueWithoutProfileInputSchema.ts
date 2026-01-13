import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { DebugLogWhereUniqueInputSchema } from './DebugLogWhereUniqueInputSchema';
import { DebugLogUpdateWithoutProfileInputSchema } from './DebugLogUpdateWithoutProfileInputSchema';
import { DebugLogUncheckedUpdateWithoutProfileInputSchema } from './DebugLogUncheckedUpdateWithoutProfileInputSchema';

export const DebugLogUpdateWithWhereUniqueWithoutProfileInputSchema: z.ZodType<Prisma.DebugLogUpdateWithWhereUniqueWithoutProfileInput> = z.strictObject({
  where: z.lazy(() => DebugLogWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => DebugLogUpdateWithoutProfileInputSchema), z.lazy(() => DebugLogUncheckedUpdateWithoutProfileInputSchema) ]),
});

export default DebugLogUpdateWithWhereUniqueWithoutProfileInputSchema;
