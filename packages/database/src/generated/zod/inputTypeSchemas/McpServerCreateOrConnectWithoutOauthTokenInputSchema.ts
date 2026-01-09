import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { McpServerWhereUniqueInputSchema } from './McpServerWhereUniqueInputSchema';
import { McpServerCreateWithoutOauthTokenInputSchema } from './McpServerCreateWithoutOauthTokenInputSchema';
import { McpServerUncheckedCreateWithoutOauthTokenInputSchema } from './McpServerUncheckedCreateWithoutOauthTokenInputSchema';

export const McpServerCreateOrConnectWithoutOauthTokenInputSchema: z.ZodType<Prisma.McpServerCreateOrConnectWithoutOauthTokenInput> = z.strictObject({
  where: z.lazy(() => McpServerWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => McpServerCreateWithoutOauthTokenInputSchema), z.lazy(() => McpServerUncheckedCreateWithoutOauthTokenInputSchema) ]),
});

export default McpServerCreateOrConnectWithoutOauthTokenInputSchema;
