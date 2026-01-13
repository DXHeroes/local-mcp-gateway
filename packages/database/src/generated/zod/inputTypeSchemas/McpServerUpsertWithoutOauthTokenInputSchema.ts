import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { McpServerUpdateWithoutOauthTokenInputSchema } from './McpServerUpdateWithoutOauthTokenInputSchema';
import { McpServerUncheckedUpdateWithoutOauthTokenInputSchema } from './McpServerUncheckedUpdateWithoutOauthTokenInputSchema';
import { McpServerCreateWithoutOauthTokenInputSchema } from './McpServerCreateWithoutOauthTokenInputSchema';
import { McpServerUncheckedCreateWithoutOauthTokenInputSchema } from './McpServerUncheckedCreateWithoutOauthTokenInputSchema';
import { McpServerWhereInputSchema } from './McpServerWhereInputSchema';

export const McpServerUpsertWithoutOauthTokenInputSchema: z.ZodType<Prisma.McpServerUpsertWithoutOauthTokenInput> = z.strictObject({
  update: z.union([ z.lazy(() => McpServerUpdateWithoutOauthTokenInputSchema), z.lazy(() => McpServerUncheckedUpdateWithoutOauthTokenInputSchema) ]),
  create: z.union([ z.lazy(() => McpServerCreateWithoutOauthTokenInputSchema), z.lazy(() => McpServerUncheckedCreateWithoutOauthTokenInputSchema) ]),
  where: z.lazy(() => McpServerWhereInputSchema).optional(),
});

export default McpServerUpsertWithoutOauthTokenInputSchema;
