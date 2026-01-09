import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { McpServerWhereUniqueInputSchema } from './McpServerWhereUniqueInputSchema';
import { McpServerCreateWithoutOauthClientRegistrationsInputSchema } from './McpServerCreateWithoutOauthClientRegistrationsInputSchema';
import { McpServerUncheckedCreateWithoutOauthClientRegistrationsInputSchema } from './McpServerUncheckedCreateWithoutOauthClientRegistrationsInputSchema';

export const McpServerCreateOrConnectWithoutOauthClientRegistrationsInputSchema: z.ZodType<Prisma.McpServerCreateOrConnectWithoutOauthClientRegistrationsInput> = z.strictObject({
  where: z.lazy(() => McpServerWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => McpServerCreateWithoutOauthClientRegistrationsInputSchema), z.lazy(() => McpServerUncheckedCreateWithoutOauthClientRegistrationsInputSchema) ]),
});

export default McpServerCreateOrConnectWithoutOauthClientRegistrationsInputSchema;
