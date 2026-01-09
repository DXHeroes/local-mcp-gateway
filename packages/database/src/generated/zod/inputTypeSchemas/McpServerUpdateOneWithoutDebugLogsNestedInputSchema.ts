import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { McpServerCreateWithoutDebugLogsInputSchema } from './McpServerCreateWithoutDebugLogsInputSchema';
import { McpServerUncheckedCreateWithoutDebugLogsInputSchema } from './McpServerUncheckedCreateWithoutDebugLogsInputSchema';
import { McpServerCreateOrConnectWithoutDebugLogsInputSchema } from './McpServerCreateOrConnectWithoutDebugLogsInputSchema';
import { McpServerUpsertWithoutDebugLogsInputSchema } from './McpServerUpsertWithoutDebugLogsInputSchema';
import { McpServerWhereInputSchema } from './McpServerWhereInputSchema';
import { McpServerWhereUniqueInputSchema } from './McpServerWhereUniqueInputSchema';
import { McpServerUpdateToOneWithWhereWithoutDebugLogsInputSchema } from './McpServerUpdateToOneWithWhereWithoutDebugLogsInputSchema';
import { McpServerUpdateWithoutDebugLogsInputSchema } from './McpServerUpdateWithoutDebugLogsInputSchema';
import { McpServerUncheckedUpdateWithoutDebugLogsInputSchema } from './McpServerUncheckedUpdateWithoutDebugLogsInputSchema';

export const McpServerUpdateOneWithoutDebugLogsNestedInputSchema: z.ZodType<Prisma.McpServerUpdateOneWithoutDebugLogsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => McpServerCreateWithoutDebugLogsInputSchema), z.lazy(() => McpServerUncheckedCreateWithoutDebugLogsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => McpServerCreateOrConnectWithoutDebugLogsInputSchema).optional(),
  upsert: z.lazy(() => McpServerUpsertWithoutDebugLogsInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => McpServerWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => McpServerWhereInputSchema) ]).optional(),
  connect: z.lazy(() => McpServerWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => McpServerUpdateToOneWithWhereWithoutDebugLogsInputSchema), z.lazy(() => McpServerUpdateWithoutDebugLogsInputSchema), z.lazy(() => McpServerUncheckedUpdateWithoutDebugLogsInputSchema) ]).optional(),
});

export default McpServerUpdateOneWithoutDebugLogsNestedInputSchema;
