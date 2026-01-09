import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { McpServerCreateWithoutOauthTokenInputSchema } from './McpServerCreateWithoutOauthTokenInputSchema';
import { McpServerUncheckedCreateWithoutOauthTokenInputSchema } from './McpServerUncheckedCreateWithoutOauthTokenInputSchema';
import { McpServerCreateOrConnectWithoutOauthTokenInputSchema } from './McpServerCreateOrConnectWithoutOauthTokenInputSchema';
import { McpServerUpsertWithoutOauthTokenInputSchema } from './McpServerUpsertWithoutOauthTokenInputSchema';
import { McpServerWhereUniqueInputSchema } from './McpServerWhereUniqueInputSchema';
import { McpServerUpdateToOneWithWhereWithoutOauthTokenInputSchema } from './McpServerUpdateToOneWithWhereWithoutOauthTokenInputSchema';
import { McpServerUpdateWithoutOauthTokenInputSchema } from './McpServerUpdateWithoutOauthTokenInputSchema';
import { McpServerUncheckedUpdateWithoutOauthTokenInputSchema } from './McpServerUncheckedUpdateWithoutOauthTokenInputSchema';

export const McpServerUpdateOneRequiredWithoutOauthTokenNestedInputSchema: z.ZodType<Prisma.McpServerUpdateOneRequiredWithoutOauthTokenNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => McpServerCreateWithoutOauthTokenInputSchema), z.lazy(() => McpServerUncheckedCreateWithoutOauthTokenInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => McpServerCreateOrConnectWithoutOauthTokenInputSchema).optional(),
  upsert: z.lazy(() => McpServerUpsertWithoutOauthTokenInputSchema).optional(),
  connect: z.lazy(() => McpServerWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => McpServerUpdateToOneWithWhereWithoutOauthTokenInputSchema), z.lazy(() => McpServerUpdateWithoutOauthTokenInputSchema), z.lazy(() => McpServerUncheckedUpdateWithoutOauthTokenInputSchema) ]).optional(),
});

export default McpServerUpdateOneRequiredWithoutOauthTokenNestedInputSchema;
