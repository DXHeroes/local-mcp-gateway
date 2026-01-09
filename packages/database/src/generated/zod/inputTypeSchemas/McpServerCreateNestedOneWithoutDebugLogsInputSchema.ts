import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { McpServerCreateWithoutDebugLogsInputSchema } from './McpServerCreateWithoutDebugLogsInputSchema';
import { McpServerUncheckedCreateWithoutDebugLogsInputSchema } from './McpServerUncheckedCreateWithoutDebugLogsInputSchema';
import { McpServerCreateOrConnectWithoutDebugLogsInputSchema } from './McpServerCreateOrConnectWithoutDebugLogsInputSchema';
import { McpServerWhereUniqueInputSchema } from './McpServerWhereUniqueInputSchema';

export const McpServerCreateNestedOneWithoutDebugLogsInputSchema: z.ZodType<Prisma.McpServerCreateNestedOneWithoutDebugLogsInput> = z.strictObject({
  create: z.union([ z.lazy(() => McpServerCreateWithoutDebugLogsInputSchema), z.lazy(() => McpServerUncheckedCreateWithoutDebugLogsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => McpServerCreateOrConnectWithoutDebugLogsInputSchema).optional(),
  connect: z.lazy(() => McpServerWhereUniqueInputSchema).optional(),
});

export default McpServerCreateNestedOneWithoutDebugLogsInputSchema;
