import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { McpServerWhereUniqueInputSchema } from './McpServerWhereUniqueInputSchema';
import { McpServerCreateWithoutProfilesInputSchema } from './McpServerCreateWithoutProfilesInputSchema';
import { McpServerUncheckedCreateWithoutProfilesInputSchema } from './McpServerUncheckedCreateWithoutProfilesInputSchema';

export const McpServerCreateOrConnectWithoutProfilesInputSchema: z.ZodType<Prisma.McpServerCreateOrConnectWithoutProfilesInput> = z.strictObject({
  where: z.lazy(() => McpServerWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => McpServerCreateWithoutProfilesInputSchema), z.lazy(() => McpServerUncheckedCreateWithoutProfilesInputSchema) ]),
});

export default McpServerCreateOrConnectWithoutProfilesInputSchema;
