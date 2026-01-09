import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { McpServerCreateWithoutProfilesInputSchema } from './McpServerCreateWithoutProfilesInputSchema';
import { McpServerUncheckedCreateWithoutProfilesInputSchema } from './McpServerUncheckedCreateWithoutProfilesInputSchema';
import { McpServerCreateOrConnectWithoutProfilesInputSchema } from './McpServerCreateOrConnectWithoutProfilesInputSchema';
import { McpServerUpsertWithoutProfilesInputSchema } from './McpServerUpsertWithoutProfilesInputSchema';
import { McpServerWhereUniqueInputSchema } from './McpServerWhereUniqueInputSchema';
import { McpServerUpdateToOneWithWhereWithoutProfilesInputSchema } from './McpServerUpdateToOneWithWhereWithoutProfilesInputSchema';
import { McpServerUpdateWithoutProfilesInputSchema } from './McpServerUpdateWithoutProfilesInputSchema';
import { McpServerUncheckedUpdateWithoutProfilesInputSchema } from './McpServerUncheckedUpdateWithoutProfilesInputSchema';

export const McpServerUpdateOneRequiredWithoutProfilesNestedInputSchema: z.ZodType<Prisma.McpServerUpdateOneRequiredWithoutProfilesNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => McpServerCreateWithoutProfilesInputSchema), z.lazy(() => McpServerUncheckedCreateWithoutProfilesInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => McpServerCreateOrConnectWithoutProfilesInputSchema).optional(),
  upsert: z.lazy(() => McpServerUpsertWithoutProfilesInputSchema).optional(),
  connect: z.lazy(() => McpServerWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => McpServerUpdateToOneWithWhereWithoutProfilesInputSchema), z.lazy(() => McpServerUpdateWithoutProfilesInputSchema), z.lazy(() => McpServerUncheckedUpdateWithoutProfilesInputSchema) ]).optional(),
});

export default McpServerUpdateOneRequiredWithoutProfilesNestedInputSchema;
