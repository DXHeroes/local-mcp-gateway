import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { McpServerUpdateWithoutToolsCacheInputSchema } from './McpServerUpdateWithoutToolsCacheInputSchema';
import { McpServerUncheckedUpdateWithoutToolsCacheInputSchema } from './McpServerUncheckedUpdateWithoutToolsCacheInputSchema';
import { McpServerCreateWithoutToolsCacheInputSchema } from './McpServerCreateWithoutToolsCacheInputSchema';
import { McpServerUncheckedCreateWithoutToolsCacheInputSchema } from './McpServerUncheckedCreateWithoutToolsCacheInputSchema';
import { McpServerWhereInputSchema } from './McpServerWhereInputSchema';

export const McpServerUpsertWithoutToolsCacheInputSchema: z.ZodType<Prisma.McpServerUpsertWithoutToolsCacheInput> = z.strictObject({
  update: z.union([ z.lazy(() => McpServerUpdateWithoutToolsCacheInputSchema), z.lazy(() => McpServerUncheckedUpdateWithoutToolsCacheInputSchema) ]),
  create: z.union([ z.lazy(() => McpServerCreateWithoutToolsCacheInputSchema), z.lazy(() => McpServerUncheckedCreateWithoutToolsCacheInputSchema) ]),
  where: z.lazy(() => McpServerWhereInputSchema).optional(),
});

export default McpServerUpsertWithoutToolsCacheInputSchema;
