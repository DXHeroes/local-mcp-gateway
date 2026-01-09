import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { McpServerUpdateWithoutProfilesInputSchema } from './McpServerUpdateWithoutProfilesInputSchema';
import { McpServerUncheckedUpdateWithoutProfilesInputSchema } from './McpServerUncheckedUpdateWithoutProfilesInputSchema';
import { McpServerCreateWithoutProfilesInputSchema } from './McpServerCreateWithoutProfilesInputSchema';
import { McpServerUncheckedCreateWithoutProfilesInputSchema } from './McpServerUncheckedCreateWithoutProfilesInputSchema';
import { McpServerWhereInputSchema } from './McpServerWhereInputSchema';

export const McpServerUpsertWithoutProfilesInputSchema: z.ZodType<Prisma.McpServerUpsertWithoutProfilesInput> = z.strictObject({
  update: z.union([ z.lazy(() => McpServerUpdateWithoutProfilesInputSchema), z.lazy(() => McpServerUncheckedUpdateWithoutProfilesInputSchema) ]),
  create: z.union([ z.lazy(() => McpServerCreateWithoutProfilesInputSchema), z.lazy(() => McpServerUncheckedCreateWithoutProfilesInputSchema) ]),
  where: z.lazy(() => McpServerWhereInputSchema).optional(),
});

export default McpServerUpsertWithoutProfilesInputSchema;
