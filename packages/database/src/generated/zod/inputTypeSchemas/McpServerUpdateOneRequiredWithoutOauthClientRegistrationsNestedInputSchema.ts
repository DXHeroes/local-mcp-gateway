import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { McpServerCreateWithoutOauthClientRegistrationsInputSchema } from './McpServerCreateWithoutOauthClientRegistrationsInputSchema';
import { McpServerUncheckedCreateWithoutOauthClientRegistrationsInputSchema } from './McpServerUncheckedCreateWithoutOauthClientRegistrationsInputSchema';
import { McpServerCreateOrConnectWithoutOauthClientRegistrationsInputSchema } from './McpServerCreateOrConnectWithoutOauthClientRegistrationsInputSchema';
import { McpServerUpsertWithoutOauthClientRegistrationsInputSchema } from './McpServerUpsertWithoutOauthClientRegistrationsInputSchema';
import { McpServerWhereUniqueInputSchema } from './McpServerWhereUniqueInputSchema';
import { McpServerUpdateToOneWithWhereWithoutOauthClientRegistrationsInputSchema } from './McpServerUpdateToOneWithWhereWithoutOauthClientRegistrationsInputSchema';
import { McpServerUpdateWithoutOauthClientRegistrationsInputSchema } from './McpServerUpdateWithoutOauthClientRegistrationsInputSchema';
import { McpServerUncheckedUpdateWithoutOauthClientRegistrationsInputSchema } from './McpServerUncheckedUpdateWithoutOauthClientRegistrationsInputSchema';

export const McpServerUpdateOneRequiredWithoutOauthClientRegistrationsNestedInputSchema: z.ZodType<Prisma.McpServerUpdateOneRequiredWithoutOauthClientRegistrationsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => McpServerCreateWithoutOauthClientRegistrationsInputSchema), z.lazy(() => McpServerUncheckedCreateWithoutOauthClientRegistrationsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => McpServerCreateOrConnectWithoutOauthClientRegistrationsInputSchema).optional(),
  upsert: z.lazy(() => McpServerUpsertWithoutOauthClientRegistrationsInputSchema).optional(),
  connect: z.lazy(() => McpServerWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => McpServerUpdateToOneWithWhereWithoutOauthClientRegistrationsInputSchema), z.lazy(() => McpServerUpdateWithoutOauthClientRegistrationsInputSchema), z.lazy(() => McpServerUncheckedUpdateWithoutOauthClientRegistrationsInputSchema) ]).optional(),
});

export default McpServerUpdateOneRequiredWithoutOauthClientRegistrationsNestedInputSchema;
