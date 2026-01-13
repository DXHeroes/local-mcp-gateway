import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { McpServerCreateWithoutToolsCacheInputSchema } from './McpServerCreateWithoutToolsCacheInputSchema';
import { McpServerUncheckedCreateWithoutToolsCacheInputSchema } from './McpServerUncheckedCreateWithoutToolsCacheInputSchema';
import { McpServerCreateOrConnectWithoutToolsCacheInputSchema } from './McpServerCreateOrConnectWithoutToolsCacheInputSchema';
import { McpServerUpsertWithoutToolsCacheInputSchema } from './McpServerUpsertWithoutToolsCacheInputSchema';
import { McpServerWhereUniqueInputSchema } from './McpServerWhereUniqueInputSchema';
import { McpServerUpdateToOneWithWhereWithoutToolsCacheInputSchema } from './McpServerUpdateToOneWithWhereWithoutToolsCacheInputSchema';
import { McpServerUpdateWithoutToolsCacheInputSchema } from './McpServerUpdateWithoutToolsCacheInputSchema';
import { McpServerUncheckedUpdateWithoutToolsCacheInputSchema } from './McpServerUncheckedUpdateWithoutToolsCacheInputSchema';

export const McpServerUpdateOneRequiredWithoutToolsCacheNestedInputSchema: z.ZodType<Prisma.McpServerUpdateOneRequiredWithoutToolsCacheNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => McpServerCreateWithoutToolsCacheInputSchema), z.lazy(() => McpServerUncheckedCreateWithoutToolsCacheInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => McpServerCreateOrConnectWithoutToolsCacheInputSchema).optional(),
  upsert: z.lazy(() => McpServerUpsertWithoutToolsCacheInputSchema).optional(),
  connect: z.lazy(() => McpServerWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => McpServerUpdateToOneWithWhereWithoutToolsCacheInputSchema), z.lazy(() => McpServerUpdateWithoutToolsCacheInputSchema), z.lazy(() => McpServerUncheckedUpdateWithoutToolsCacheInputSchema) ]).optional(),
});

export default McpServerUpdateOneRequiredWithoutToolsCacheNestedInputSchema;
