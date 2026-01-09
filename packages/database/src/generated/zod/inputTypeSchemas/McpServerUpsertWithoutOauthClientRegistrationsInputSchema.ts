import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { McpServerUpdateWithoutOauthClientRegistrationsInputSchema } from './McpServerUpdateWithoutOauthClientRegistrationsInputSchema';
import { McpServerUncheckedUpdateWithoutOauthClientRegistrationsInputSchema } from './McpServerUncheckedUpdateWithoutOauthClientRegistrationsInputSchema';
import { McpServerCreateWithoutOauthClientRegistrationsInputSchema } from './McpServerCreateWithoutOauthClientRegistrationsInputSchema';
import { McpServerUncheckedCreateWithoutOauthClientRegistrationsInputSchema } from './McpServerUncheckedCreateWithoutOauthClientRegistrationsInputSchema';
import { McpServerWhereInputSchema } from './McpServerWhereInputSchema';

export const McpServerUpsertWithoutOauthClientRegistrationsInputSchema: z.ZodType<Prisma.McpServerUpsertWithoutOauthClientRegistrationsInput> = z.strictObject({
  update: z.union([ z.lazy(() => McpServerUpdateWithoutOauthClientRegistrationsInputSchema), z.lazy(() => McpServerUncheckedUpdateWithoutOauthClientRegistrationsInputSchema) ]),
  create: z.union([ z.lazy(() => McpServerCreateWithoutOauthClientRegistrationsInputSchema), z.lazy(() => McpServerUncheckedCreateWithoutOauthClientRegistrationsInputSchema) ]),
  where: z.lazy(() => McpServerWhereInputSchema).optional(),
});

export default McpServerUpsertWithoutOauthClientRegistrationsInputSchema;
