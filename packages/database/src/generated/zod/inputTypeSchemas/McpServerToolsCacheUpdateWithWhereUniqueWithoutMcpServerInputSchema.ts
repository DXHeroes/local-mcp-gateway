import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { McpServerToolsCacheWhereUniqueInputSchema } from './McpServerToolsCacheWhereUniqueInputSchema';
import { McpServerToolsCacheUpdateWithoutMcpServerInputSchema } from './McpServerToolsCacheUpdateWithoutMcpServerInputSchema';
import { McpServerToolsCacheUncheckedUpdateWithoutMcpServerInputSchema } from './McpServerToolsCacheUncheckedUpdateWithoutMcpServerInputSchema';

export const McpServerToolsCacheUpdateWithWhereUniqueWithoutMcpServerInputSchema: z.ZodType<Prisma.McpServerToolsCacheUpdateWithWhereUniqueWithoutMcpServerInput> = z.strictObject({
  where: z.lazy(() => McpServerToolsCacheWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => McpServerToolsCacheUpdateWithoutMcpServerInputSchema), z.lazy(() => McpServerToolsCacheUncheckedUpdateWithoutMcpServerInputSchema) ]),
});

export default McpServerToolsCacheUpdateWithWhereUniqueWithoutMcpServerInputSchema;
