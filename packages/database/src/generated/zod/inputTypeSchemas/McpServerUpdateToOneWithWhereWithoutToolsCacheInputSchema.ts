import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { McpServerWhereInputSchema } from './McpServerWhereInputSchema';
import { McpServerUpdateWithoutToolsCacheInputSchema } from './McpServerUpdateWithoutToolsCacheInputSchema';
import { McpServerUncheckedUpdateWithoutToolsCacheInputSchema } from './McpServerUncheckedUpdateWithoutToolsCacheInputSchema';

export const McpServerUpdateToOneWithWhereWithoutToolsCacheInputSchema: z.ZodType<Prisma.McpServerUpdateToOneWithWhereWithoutToolsCacheInput> = z.strictObject({
  where: z.lazy(() => McpServerWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => McpServerUpdateWithoutToolsCacheInputSchema), z.lazy(() => McpServerUncheckedUpdateWithoutToolsCacheInputSchema) ]),
});

export default McpServerUpdateToOneWithWhereWithoutToolsCacheInputSchema;
