import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { McpServerCreateWithoutOauthTokenInputSchema } from './McpServerCreateWithoutOauthTokenInputSchema';
import { McpServerUncheckedCreateWithoutOauthTokenInputSchema } from './McpServerUncheckedCreateWithoutOauthTokenInputSchema';
import { McpServerCreateOrConnectWithoutOauthTokenInputSchema } from './McpServerCreateOrConnectWithoutOauthTokenInputSchema';
import { McpServerWhereUniqueInputSchema } from './McpServerWhereUniqueInputSchema';

export const McpServerCreateNestedOneWithoutOauthTokenInputSchema: z.ZodType<Prisma.McpServerCreateNestedOneWithoutOauthTokenInput> = z.strictObject({
  create: z.union([ z.lazy(() => McpServerCreateWithoutOauthTokenInputSchema), z.lazy(() => McpServerUncheckedCreateWithoutOauthTokenInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => McpServerCreateOrConnectWithoutOauthTokenInputSchema).optional(),
  connect: z.lazy(() => McpServerWhereUniqueInputSchema).optional(),
});

export default McpServerCreateNestedOneWithoutOauthTokenInputSchema;
