import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { McpServerCreateWithoutOauthClientRegistrationsInputSchema } from './McpServerCreateWithoutOauthClientRegistrationsInputSchema';
import { McpServerUncheckedCreateWithoutOauthClientRegistrationsInputSchema } from './McpServerUncheckedCreateWithoutOauthClientRegistrationsInputSchema';
import { McpServerCreateOrConnectWithoutOauthClientRegistrationsInputSchema } from './McpServerCreateOrConnectWithoutOauthClientRegistrationsInputSchema';
import { McpServerWhereUniqueInputSchema } from './McpServerWhereUniqueInputSchema';

export const McpServerCreateNestedOneWithoutOauthClientRegistrationsInputSchema: z.ZodType<Prisma.McpServerCreateNestedOneWithoutOauthClientRegistrationsInput> = z.strictObject({
  create: z.union([ z.lazy(() => McpServerCreateWithoutOauthClientRegistrationsInputSchema), z.lazy(() => McpServerUncheckedCreateWithoutOauthClientRegistrationsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => McpServerCreateOrConnectWithoutOauthClientRegistrationsInputSchema).optional(),
  connect: z.lazy(() => McpServerWhereUniqueInputSchema).optional(),
});

export default McpServerCreateNestedOneWithoutOauthClientRegistrationsInputSchema;
