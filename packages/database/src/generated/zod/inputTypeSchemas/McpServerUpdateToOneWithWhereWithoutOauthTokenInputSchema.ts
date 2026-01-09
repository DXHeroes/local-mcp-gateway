import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { McpServerWhereInputSchema } from './McpServerWhereInputSchema';
import { McpServerUpdateWithoutOauthTokenInputSchema } from './McpServerUpdateWithoutOauthTokenInputSchema';
import { McpServerUncheckedUpdateWithoutOauthTokenInputSchema } from './McpServerUncheckedUpdateWithoutOauthTokenInputSchema';

export const McpServerUpdateToOneWithWhereWithoutOauthTokenInputSchema: z.ZodType<Prisma.McpServerUpdateToOneWithWhereWithoutOauthTokenInput> = z.strictObject({
  where: z.lazy(() => McpServerWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => McpServerUpdateWithoutOauthTokenInputSchema), z.lazy(() => McpServerUncheckedUpdateWithoutOauthTokenInputSchema) ]),
});

export default McpServerUpdateToOneWithWhereWithoutOauthTokenInputSchema;
