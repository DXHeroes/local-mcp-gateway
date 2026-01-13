import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { OAuthClientRegistrationWhereUniqueInputSchema } from './OAuthClientRegistrationWhereUniqueInputSchema';
import { OAuthClientRegistrationCreateWithoutMcpServerInputSchema } from './OAuthClientRegistrationCreateWithoutMcpServerInputSchema';
import { OAuthClientRegistrationUncheckedCreateWithoutMcpServerInputSchema } from './OAuthClientRegistrationUncheckedCreateWithoutMcpServerInputSchema';

export const OAuthClientRegistrationCreateOrConnectWithoutMcpServerInputSchema: z.ZodType<Prisma.OAuthClientRegistrationCreateOrConnectWithoutMcpServerInput> = z.strictObject({
  where: z.lazy(() => OAuthClientRegistrationWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => OAuthClientRegistrationCreateWithoutMcpServerInputSchema), z.lazy(() => OAuthClientRegistrationUncheckedCreateWithoutMcpServerInputSchema) ]),
});

export default OAuthClientRegistrationCreateOrConnectWithoutMcpServerInputSchema;
