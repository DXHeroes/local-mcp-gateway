import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { DebugLogScalarWhereInputSchema } from './DebugLogScalarWhereInputSchema';
import { DebugLogUpdateManyMutationInputSchema } from './DebugLogUpdateManyMutationInputSchema';
import { DebugLogUncheckedUpdateManyWithoutProfileInputSchema } from './DebugLogUncheckedUpdateManyWithoutProfileInputSchema';

export const DebugLogUpdateManyWithWhereWithoutProfileInputSchema: z.ZodType<Prisma.DebugLogUpdateManyWithWhereWithoutProfileInput> = z.strictObject({
  where: z.lazy(() => DebugLogScalarWhereInputSchema),
  data: z.union([ z.lazy(() => DebugLogUpdateManyMutationInputSchema), z.lazy(() => DebugLogUncheckedUpdateManyWithoutProfileInputSchema) ]),
});

export default DebugLogUpdateManyWithWhereWithoutProfileInputSchema;
