import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { OAuthClientRegistrationCreateWithoutMcpServerInputSchema } from './OAuthClientRegistrationCreateWithoutMcpServerInputSchema';
import { OAuthClientRegistrationUncheckedCreateWithoutMcpServerInputSchema } from './OAuthClientRegistrationUncheckedCreateWithoutMcpServerInputSchema';
import { OAuthClientRegistrationCreateOrConnectWithoutMcpServerInputSchema } from './OAuthClientRegistrationCreateOrConnectWithoutMcpServerInputSchema';
import { OAuthClientRegistrationCreateManyMcpServerInputEnvelopeSchema } from './OAuthClientRegistrationCreateManyMcpServerInputEnvelopeSchema';
import { OAuthClientRegistrationWhereUniqueInputSchema } from './OAuthClientRegistrationWhereUniqueInputSchema';

export const OAuthClientRegistrationCreateNestedManyWithoutMcpServerInputSchema: z.ZodType<Prisma.OAuthClientRegistrationCreateNestedManyWithoutMcpServerInput> = z.strictObject({
  create: z.union([ z.lazy(() => OAuthClientRegistrationCreateWithoutMcpServerInputSchema), z.lazy(() => OAuthClientRegistrationCreateWithoutMcpServerInputSchema).array(), z.lazy(() => OAuthClientRegistrationUncheckedCreateWithoutMcpServerInputSchema), z.lazy(() => OAuthClientRegistrationUncheckedCreateWithoutMcpServerInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => OAuthClientRegistrationCreateOrConnectWithoutMcpServerInputSchema), z.lazy(() => OAuthClientRegistrationCreateOrConnectWithoutMcpServerInputSchema).array() ]).optional(),
  createMany: z.lazy(() => OAuthClientRegistrationCreateManyMcpServerInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => OAuthClientRegistrationWhereUniqueInputSchema), z.lazy(() => OAuthClientRegistrationWhereUniqueInputSchema).array() ]).optional(),
});

export default OAuthClientRegistrationCreateNestedManyWithoutMcpServerInputSchema;
