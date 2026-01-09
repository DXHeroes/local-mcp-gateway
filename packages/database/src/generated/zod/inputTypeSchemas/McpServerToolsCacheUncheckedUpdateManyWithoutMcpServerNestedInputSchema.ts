import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { McpServerToolsCacheCreateWithoutMcpServerInputSchema } from './McpServerToolsCacheCreateWithoutMcpServerInputSchema';
import { McpServerToolsCacheUncheckedCreateWithoutMcpServerInputSchema } from './McpServerToolsCacheUncheckedCreateWithoutMcpServerInputSchema';
import { McpServerToolsCacheCreateOrConnectWithoutMcpServerInputSchema } from './McpServerToolsCacheCreateOrConnectWithoutMcpServerInputSchema';
import { McpServerToolsCacheUpsertWithWhereUniqueWithoutMcpServerInputSchema } from './McpServerToolsCacheUpsertWithWhereUniqueWithoutMcpServerInputSchema';
import { McpServerToolsCacheCreateManyMcpServerInputEnvelopeSchema } from './McpServerToolsCacheCreateManyMcpServerInputEnvelopeSchema';
import { McpServerToolsCacheWhereUniqueInputSchema } from './McpServerToolsCacheWhereUniqueInputSchema';
import { McpServerToolsCacheUpdateWithWhereUniqueWithoutMcpServerInputSchema } from './McpServerToolsCacheUpdateWithWhereUniqueWithoutMcpServerInputSchema';
import { McpServerToolsCacheUpdateManyWithWhereWithoutMcpServerInputSchema } from './McpServerToolsCacheUpdateManyWithWhereWithoutMcpServerInputSchema';
import { McpServerToolsCacheScalarWhereInputSchema } from './McpServerToolsCacheScalarWhereInputSchema';

export const McpServerToolsCacheUncheckedUpdateManyWithoutMcpServerNestedInputSchema: z.ZodType<Prisma.McpServerToolsCacheUncheckedUpdateManyWithoutMcpServerNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => McpServerToolsCacheCreateWithoutMcpServerInputSchema), z.lazy(() => McpServerToolsCacheCreateWithoutMcpServerInputSchema).array(), z.lazy(() => McpServerToolsCacheUncheckedCreateWithoutMcpServerInputSchema), z.lazy(() => McpServerToolsCacheUncheckedCreateWithoutMcpServerInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => McpServerToolsCacheCreateOrConnectWithoutMcpServerInputSchema), z.lazy(() => McpServerToolsCacheCreateOrConnectWithoutMcpServerInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => McpServerToolsCacheUpsertWithWhereUniqueWithoutMcpServerInputSchema), z.lazy(() => McpServerToolsCacheUpsertWithWhereUniqueWithoutMcpServerInputSchema).array() ]).optional(),
  createMany: z.lazy(() => McpServerToolsCacheCreateManyMcpServerInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => McpServerToolsCacheWhereUniqueInputSchema), z.lazy(() => McpServerToolsCacheWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => McpServerToolsCacheWhereUniqueInputSchema), z.lazy(() => McpServerToolsCacheWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => McpServerToolsCacheWhereUniqueInputSchema), z.lazy(() => McpServerToolsCacheWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => McpServerToolsCacheWhereUniqueInputSchema), z.lazy(() => McpServerToolsCacheWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => McpServerToolsCacheUpdateWithWhereUniqueWithoutMcpServerInputSchema), z.lazy(() => McpServerToolsCacheUpdateWithWhereUniqueWithoutMcpServerInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => McpServerToolsCacheUpdateManyWithWhereWithoutMcpServerInputSchema), z.lazy(() => McpServerToolsCacheUpdateManyWithWhereWithoutMcpServerInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => McpServerToolsCacheScalarWhereInputSchema), z.lazy(() => McpServerToolsCacheScalarWhereInputSchema).array() ]).optional(),
});

export default McpServerToolsCacheUncheckedUpdateManyWithoutMcpServerNestedInputSchema;
