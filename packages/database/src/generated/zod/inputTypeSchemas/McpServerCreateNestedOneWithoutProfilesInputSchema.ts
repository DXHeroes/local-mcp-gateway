import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { McpServerCreateWithoutProfilesInputSchema } from './McpServerCreateWithoutProfilesInputSchema';
import { McpServerUncheckedCreateWithoutProfilesInputSchema } from './McpServerUncheckedCreateWithoutProfilesInputSchema';
import { McpServerCreateOrConnectWithoutProfilesInputSchema } from './McpServerCreateOrConnectWithoutProfilesInputSchema';
import { McpServerWhereUniqueInputSchema } from './McpServerWhereUniqueInputSchema';

export const McpServerCreateNestedOneWithoutProfilesInputSchema: z.ZodType<Prisma.McpServerCreateNestedOneWithoutProfilesInput> = z.strictObject({
  create: z.union([ z.lazy(() => McpServerCreateWithoutProfilesInputSchema), z.lazy(() => McpServerUncheckedCreateWithoutProfilesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => McpServerCreateOrConnectWithoutProfilesInputSchema).optional(),
  connect: z.lazy(() => McpServerWhereUniqueInputSchema).optional(),
});

export default McpServerCreateNestedOneWithoutProfilesInputSchema;
