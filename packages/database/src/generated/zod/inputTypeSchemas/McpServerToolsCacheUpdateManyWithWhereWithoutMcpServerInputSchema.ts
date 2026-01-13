import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { McpServerToolsCacheScalarWhereInputSchema } from './McpServerToolsCacheScalarWhereInputSchema';
import { McpServerToolsCacheUpdateManyMutationInputSchema } from './McpServerToolsCacheUpdateManyMutationInputSchema';
import { McpServerToolsCacheUncheckedUpdateManyWithoutMcpServerInputSchema } from './McpServerToolsCacheUncheckedUpdateManyWithoutMcpServerInputSchema';

export const McpServerToolsCacheUpdateManyWithWhereWithoutMcpServerInputSchema: z.ZodType<Prisma.McpServerToolsCacheUpdateManyWithWhereWithoutMcpServerInput> = z.strictObject({
  where: z.lazy(() => McpServerToolsCacheScalarWhereInputSchema),
  data: z.union([ z.lazy(() => McpServerToolsCacheUpdateManyMutationInputSchema), z.lazy(() => McpServerToolsCacheUncheckedUpdateManyWithoutMcpServerInputSchema) ]),
});

export default McpServerToolsCacheUpdateManyWithWhereWithoutMcpServerInputSchema;
