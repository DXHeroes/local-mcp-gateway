import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { McpServerUpdateWithoutDebugLogsInputSchema } from './McpServerUpdateWithoutDebugLogsInputSchema';
import { McpServerUncheckedUpdateWithoutDebugLogsInputSchema } from './McpServerUncheckedUpdateWithoutDebugLogsInputSchema';
import { McpServerCreateWithoutDebugLogsInputSchema } from './McpServerCreateWithoutDebugLogsInputSchema';
import { McpServerUncheckedCreateWithoutDebugLogsInputSchema } from './McpServerUncheckedCreateWithoutDebugLogsInputSchema';
import { McpServerWhereInputSchema } from './McpServerWhereInputSchema';

export const McpServerUpsertWithoutDebugLogsInputSchema: z.ZodType<Prisma.McpServerUpsertWithoutDebugLogsInput> = z.strictObject({
  update: z.union([ z.lazy(() => McpServerUpdateWithoutDebugLogsInputSchema), z.lazy(() => McpServerUncheckedUpdateWithoutDebugLogsInputSchema) ]),
  create: z.union([ z.lazy(() => McpServerCreateWithoutDebugLogsInputSchema), z.lazy(() => McpServerUncheckedCreateWithoutDebugLogsInputSchema) ]),
  where: z.lazy(() => McpServerWhereInputSchema).optional(),
});

export default McpServerUpsertWithoutDebugLogsInputSchema;
