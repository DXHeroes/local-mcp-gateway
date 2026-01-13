import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { McpServerToolsCacheWhereUniqueInputSchema } from './McpServerToolsCacheWhereUniqueInputSchema';
import { McpServerToolsCacheUpdateWithoutMcpServerInputSchema } from './McpServerToolsCacheUpdateWithoutMcpServerInputSchema';
import { McpServerToolsCacheUncheckedUpdateWithoutMcpServerInputSchema } from './McpServerToolsCacheUncheckedUpdateWithoutMcpServerInputSchema';
import { McpServerToolsCacheCreateWithoutMcpServerInputSchema } from './McpServerToolsCacheCreateWithoutMcpServerInputSchema';
import { McpServerToolsCacheUncheckedCreateWithoutMcpServerInputSchema } from './McpServerToolsCacheUncheckedCreateWithoutMcpServerInputSchema';

export const McpServerToolsCacheUpsertWithWhereUniqueWithoutMcpServerInputSchema: z.ZodType<Prisma.McpServerToolsCacheUpsertWithWhereUniqueWithoutMcpServerInput> = z.strictObject({
  where: z.lazy(() => McpServerToolsCacheWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => McpServerToolsCacheUpdateWithoutMcpServerInputSchema), z.lazy(() => McpServerToolsCacheUncheckedUpdateWithoutMcpServerInputSchema) ]),
  create: z.union([ z.lazy(() => McpServerToolsCacheCreateWithoutMcpServerInputSchema), z.lazy(() => McpServerToolsCacheUncheckedCreateWithoutMcpServerInputSchema) ]),
});

export default McpServerToolsCacheUpsertWithWhereUniqueWithoutMcpServerInputSchema;
