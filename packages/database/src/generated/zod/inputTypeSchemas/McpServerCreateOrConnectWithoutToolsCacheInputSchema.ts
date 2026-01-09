import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { McpServerWhereUniqueInputSchema } from './McpServerWhereUniqueInputSchema';
import { McpServerCreateWithoutToolsCacheInputSchema } from './McpServerCreateWithoutToolsCacheInputSchema';
import { McpServerUncheckedCreateWithoutToolsCacheInputSchema } from './McpServerUncheckedCreateWithoutToolsCacheInputSchema';

export const McpServerCreateOrConnectWithoutToolsCacheInputSchema: z.ZodType<Prisma.McpServerCreateOrConnectWithoutToolsCacheInput> = z.strictObject({
  where: z.lazy(() => McpServerWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => McpServerCreateWithoutToolsCacheInputSchema), z.lazy(() => McpServerUncheckedCreateWithoutToolsCacheInputSchema) ]),
});

export default McpServerCreateOrConnectWithoutToolsCacheInputSchema;
