import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { McpServerWhereInputSchema } from './McpServerWhereInputSchema';
import { McpServerUpdateWithoutOauthClientRegistrationsInputSchema } from './McpServerUpdateWithoutOauthClientRegistrationsInputSchema';
import { McpServerUncheckedUpdateWithoutOauthClientRegistrationsInputSchema } from './McpServerUncheckedUpdateWithoutOauthClientRegistrationsInputSchema';

export const McpServerUpdateToOneWithWhereWithoutOauthClientRegistrationsInputSchema: z.ZodType<Prisma.McpServerUpdateToOneWithWhereWithoutOauthClientRegistrationsInput> = z.strictObject({
  where: z.lazy(() => McpServerWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => McpServerUpdateWithoutOauthClientRegistrationsInputSchema), z.lazy(() => McpServerUncheckedUpdateWithoutOauthClientRegistrationsInputSchema) ]),
});

export default McpServerUpdateToOneWithWhereWithoutOauthClientRegistrationsInputSchema;
