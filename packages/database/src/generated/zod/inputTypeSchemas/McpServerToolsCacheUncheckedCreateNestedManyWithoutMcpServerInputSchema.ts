import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { McpServerToolsCacheCreateWithoutMcpServerInputSchema } from './McpServerToolsCacheCreateWithoutMcpServerInputSchema';
import { McpServerToolsCacheUncheckedCreateWithoutMcpServerInputSchema } from './McpServerToolsCacheUncheckedCreateWithoutMcpServerInputSchema';
import { McpServerToolsCacheCreateOrConnectWithoutMcpServerInputSchema } from './McpServerToolsCacheCreateOrConnectWithoutMcpServerInputSchema';
import { McpServerToolsCacheCreateManyMcpServerInputEnvelopeSchema } from './McpServerToolsCacheCreateManyMcpServerInputEnvelopeSchema';
import { McpServerToolsCacheWhereUniqueInputSchema } from './McpServerToolsCacheWhereUniqueInputSchema';

export const McpServerToolsCacheUncheckedCreateNestedManyWithoutMcpServerInputSchema: z.ZodType<Prisma.McpServerToolsCacheUncheckedCreateNestedManyWithoutMcpServerInput> = z.strictObject({
  create: z.union([ z.lazy(() => McpServerToolsCacheCreateWithoutMcpServerInputSchema), z.lazy(() => McpServerToolsCacheCreateWithoutMcpServerInputSchema).array(), z.lazy(() => McpServerToolsCacheUncheckedCreateWithoutMcpServerInputSchema), z.lazy(() => McpServerToolsCacheUncheckedCreateWithoutMcpServerInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => McpServerToolsCacheCreateOrConnectWithoutMcpServerInputSchema), z.lazy(() => McpServerToolsCacheCreateOrConnectWithoutMcpServerInputSchema).array() ]).optional(),
  createMany: z.lazy(() => McpServerToolsCacheCreateManyMcpServerInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => McpServerToolsCacheWhereUniqueInputSchema), z.lazy(() => McpServerToolsCacheWhereUniqueInputSchema).array() ]).optional(),
});

export default McpServerToolsCacheUncheckedCreateNestedManyWithoutMcpServerInputSchema;
