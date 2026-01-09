import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { McpServerToolsCacheWhereUniqueInputSchema } from './McpServerToolsCacheWhereUniqueInputSchema';
import { McpServerToolsCacheCreateWithoutMcpServerInputSchema } from './McpServerToolsCacheCreateWithoutMcpServerInputSchema';
import { McpServerToolsCacheUncheckedCreateWithoutMcpServerInputSchema } from './McpServerToolsCacheUncheckedCreateWithoutMcpServerInputSchema';

export const McpServerToolsCacheCreateOrConnectWithoutMcpServerInputSchema: z.ZodType<Prisma.McpServerToolsCacheCreateOrConnectWithoutMcpServerInput> = z.strictObject({
  where: z.lazy(() => McpServerToolsCacheWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => McpServerToolsCacheCreateWithoutMcpServerInputSchema), z.lazy(() => McpServerToolsCacheUncheckedCreateWithoutMcpServerInputSchema) ]),
});

export default McpServerToolsCacheCreateOrConnectWithoutMcpServerInputSchema;
