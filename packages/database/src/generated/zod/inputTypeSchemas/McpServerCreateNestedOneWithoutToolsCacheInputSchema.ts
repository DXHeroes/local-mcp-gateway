import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { McpServerCreateWithoutToolsCacheInputSchema } from './McpServerCreateWithoutToolsCacheInputSchema';
import { McpServerUncheckedCreateWithoutToolsCacheInputSchema } from './McpServerUncheckedCreateWithoutToolsCacheInputSchema';
import { McpServerCreateOrConnectWithoutToolsCacheInputSchema } from './McpServerCreateOrConnectWithoutToolsCacheInputSchema';
import { McpServerWhereUniqueInputSchema } from './McpServerWhereUniqueInputSchema';

export const McpServerCreateNestedOneWithoutToolsCacheInputSchema: z.ZodType<Prisma.McpServerCreateNestedOneWithoutToolsCacheInput> = z.strictObject({
  create: z.union([ z.lazy(() => McpServerCreateWithoutToolsCacheInputSchema), z.lazy(() => McpServerUncheckedCreateWithoutToolsCacheInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => McpServerCreateOrConnectWithoutToolsCacheInputSchema).optional(),
  connect: z.lazy(() => McpServerWhereUniqueInputSchema).optional(),
});

export default McpServerCreateNestedOneWithoutToolsCacheInputSchema;
