import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { OAuthTokenCreateWithoutMcpServerInputSchema } from './OAuthTokenCreateWithoutMcpServerInputSchema';
import { OAuthTokenUncheckedCreateWithoutMcpServerInputSchema } from './OAuthTokenUncheckedCreateWithoutMcpServerInputSchema';
import { OAuthTokenCreateOrConnectWithoutMcpServerInputSchema } from './OAuthTokenCreateOrConnectWithoutMcpServerInputSchema';
import { OAuthTokenWhereUniqueInputSchema } from './OAuthTokenWhereUniqueInputSchema';

export const OAuthTokenCreateNestedOneWithoutMcpServerInputSchema: z.ZodType<Prisma.OAuthTokenCreateNestedOneWithoutMcpServerInput> = z.strictObject({
  create: z.union([ z.lazy(() => OAuthTokenCreateWithoutMcpServerInputSchema), z.lazy(() => OAuthTokenUncheckedCreateWithoutMcpServerInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => OAuthTokenCreateOrConnectWithoutMcpServerInputSchema).optional(),
  connect: z.lazy(() => OAuthTokenWhereUniqueInputSchema).optional(),
});

export default OAuthTokenCreateNestedOneWithoutMcpServerInputSchema;
