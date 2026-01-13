import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { McpServerWhereInputSchema } from './McpServerWhereInputSchema';
import { McpServerUpdateWithoutDebugLogsInputSchema } from './McpServerUpdateWithoutDebugLogsInputSchema';
import { McpServerUncheckedUpdateWithoutDebugLogsInputSchema } from './McpServerUncheckedUpdateWithoutDebugLogsInputSchema';

export const McpServerUpdateToOneWithWhereWithoutDebugLogsInputSchema: z.ZodType<Prisma.McpServerUpdateToOneWithWhereWithoutDebugLogsInput> = z.strictObject({
  where: z.lazy(() => McpServerWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => McpServerUpdateWithoutDebugLogsInputSchema), z.lazy(() => McpServerUncheckedUpdateWithoutDebugLogsInputSchema) ]),
});

export default McpServerUpdateToOneWithWhereWithoutDebugLogsInputSchema;
