import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { McpServerWhereUniqueInputSchema } from './McpServerWhereUniqueInputSchema';
import { McpServerCreateWithoutDebugLogsInputSchema } from './McpServerCreateWithoutDebugLogsInputSchema';
import { McpServerUncheckedCreateWithoutDebugLogsInputSchema } from './McpServerUncheckedCreateWithoutDebugLogsInputSchema';

export const McpServerCreateOrConnectWithoutDebugLogsInputSchema: z.ZodType<Prisma.McpServerCreateOrConnectWithoutDebugLogsInput> = z.strictObject({
  where: z.lazy(() => McpServerWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => McpServerCreateWithoutDebugLogsInputSchema), z.lazy(() => McpServerUncheckedCreateWithoutDebugLogsInputSchema) ]),
});

export default McpServerCreateOrConnectWithoutDebugLogsInputSchema;
