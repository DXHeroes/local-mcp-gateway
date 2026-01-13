import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { OAuthTokenWhereUniqueInputSchema } from './OAuthTokenWhereUniqueInputSchema';
import { OAuthTokenCreateWithoutMcpServerInputSchema } from './OAuthTokenCreateWithoutMcpServerInputSchema';
import { OAuthTokenUncheckedCreateWithoutMcpServerInputSchema } from './OAuthTokenUncheckedCreateWithoutMcpServerInputSchema';

export const OAuthTokenCreateOrConnectWithoutMcpServerInputSchema: z.ZodType<Prisma.OAuthTokenCreateOrConnectWithoutMcpServerInput> = z.strictObject({
  where: z.lazy(() => OAuthTokenWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => OAuthTokenCreateWithoutMcpServerInputSchema), z.lazy(() => OAuthTokenUncheckedCreateWithoutMcpServerInputSchema) ]),
});

export default OAuthTokenCreateOrConnectWithoutMcpServerInputSchema;
