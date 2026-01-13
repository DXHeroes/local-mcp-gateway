import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { OAuthTokenCreateWithoutMcpServerInputSchema } from './OAuthTokenCreateWithoutMcpServerInputSchema';
import { OAuthTokenUncheckedCreateWithoutMcpServerInputSchema } from './OAuthTokenUncheckedCreateWithoutMcpServerInputSchema';
import { OAuthTokenCreateOrConnectWithoutMcpServerInputSchema } from './OAuthTokenCreateOrConnectWithoutMcpServerInputSchema';
import { OAuthTokenUpsertWithoutMcpServerInputSchema } from './OAuthTokenUpsertWithoutMcpServerInputSchema';
import { OAuthTokenWhereInputSchema } from './OAuthTokenWhereInputSchema';
import { OAuthTokenWhereUniqueInputSchema } from './OAuthTokenWhereUniqueInputSchema';
import { OAuthTokenUpdateToOneWithWhereWithoutMcpServerInputSchema } from './OAuthTokenUpdateToOneWithWhereWithoutMcpServerInputSchema';
import { OAuthTokenUpdateWithoutMcpServerInputSchema } from './OAuthTokenUpdateWithoutMcpServerInputSchema';
import { OAuthTokenUncheckedUpdateWithoutMcpServerInputSchema } from './OAuthTokenUncheckedUpdateWithoutMcpServerInputSchema';

export const OAuthTokenUncheckedUpdateOneWithoutMcpServerNestedInputSchema: z.ZodType<Prisma.OAuthTokenUncheckedUpdateOneWithoutMcpServerNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => OAuthTokenCreateWithoutMcpServerInputSchema), z.lazy(() => OAuthTokenUncheckedCreateWithoutMcpServerInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => OAuthTokenCreateOrConnectWithoutMcpServerInputSchema).optional(),
  upsert: z.lazy(() => OAuthTokenUpsertWithoutMcpServerInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => OAuthTokenWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => OAuthTokenWhereInputSchema) ]).optional(),
  connect: z.lazy(() => OAuthTokenWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => OAuthTokenUpdateToOneWithWhereWithoutMcpServerInputSchema), z.lazy(() => OAuthTokenUpdateWithoutMcpServerInputSchema), z.lazy(() => OAuthTokenUncheckedUpdateWithoutMcpServerInputSchema) ]).optional(),
});

export default OAuthTokenUncheckedUpdateOneWithoutMcpServerNestedInputSchema;
