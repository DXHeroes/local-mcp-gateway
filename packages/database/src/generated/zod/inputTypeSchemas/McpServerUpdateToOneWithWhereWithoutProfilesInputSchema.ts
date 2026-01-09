import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { McpServerWhereInputSchema } from './McpServerWhereInputSchema';
import { McpServerUpdateWithoutProfilesInputSchema } from './McpServerUpdateWithoutProfilesInputSchema';
import { McpServerUncheckedUpdateWithoutProfilesInputSchema } from './McpServerUncheckedUpdateWithoutProfilesInputSchema';

export const McpServerUpdateToOneWithWhereWithoutProfilesInputSchema: z.ZodType<Prisma.McpServerUpdateToOneWithWhereWithoutProfilesInput> = z.strictObject({
  where: z.lazy(() => McpServerWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => McpServerUpdateWithoutProfilesInputSchema), z.lazy(() => McpServerUncheckedUpdateWithoutProfilesInputSchema) ]),
});

export default McpServerUpdateToOneWithWhereWithoutProfilesInputSchema;
