import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { OAuthTokenUpdateWithoutMcpServerInputSchema } from './OAuthTokenUpdateWithoutMcpServerInputSchema';
import { OAuthTokenUncheckedUpdateWithoutMcpServerInputSchema } from './OAuthTokenUncheckedUpdateWithoutMcpServerInputSchema';
import { OAuthTokenCreateWithoutMcpServerInputSchema } from './OAuthTokenCreateWithoutMcpServerInputSchema';
import { OAuthTokenUncheckedCreateWithoutMcpServerInputSchema } from './OAuthTokenUncheckedCreateWithoutMcpServerInputSchema';
import { OAuthTokenWhereInputSchema } from './OAuthTokenWhereInputSchema';

export const OAuthTokenUpsertWithoutMcpServerInputSchema: z.ZodType<Prisma.OAuthTokenUpsertWithoutMcpServerInput> = z.strictObject({
  update: z.union([ z.lazy(() => OAuthTokenUpdateWithoutMcpServerInputSchema), z.lazy(() => OAuthTokenUncheckedUpdateWithoutMcpServerInputSchema) ]),
  create: z.union([ z.lazy(() => OAuthTokenCreateWithoutMcpServerInputSchema), z.lazy(() => OAuthTokenUncheckedCreateWithoutMcpServerInputSchema) ]),
  where: z.lazy(() => OAuthTokenWhereInputSchema).optional(),
});

export default OAuthTokenUpsertWithoutMcpServerInputSchema;
