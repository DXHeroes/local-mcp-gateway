import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { DebugLogScalarWhereInputSchema } from './DebugLogScalarWhereInputSchema';
import { DebugLogUpdateManyMutationInputSchema } from './DebugLogUpdateManyMutationInputSchema';
import { DebugLogUncheckedUpdateManyWithoutMcpServerInputSchema } from './DebugLogUncheckedUpdateManyWithoutMcpServerInputSchema';

export const DebugLogUpdateManyWithWhereWithoutMcpServerInputSchema: z.ZodType<Prisma.DebugLogUpdateManyWithWhereWithoutMcpServerInput> = z.strictObject({
  where: z.lazy(() => DebugLogScalarWhereInputSchema),
  data: z.union([ z.lazy(() => DebugLogUpdateManyMutationInputSchema), z.lazy(() => DebugLogUncheckedUpdateManyWithoutMcpServerInputSchema) ]),
});

export default DebugLogUpdateManyWithWhereWithoutMcpServerInputSchema;
