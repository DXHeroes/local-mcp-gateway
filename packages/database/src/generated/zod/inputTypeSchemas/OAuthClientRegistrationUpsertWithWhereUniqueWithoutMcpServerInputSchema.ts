import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { OAuthClientRegistrationWhereUniqueInputSchema } from './OAuthClientRegistrationWhereUniqueInputSchema';
import { OAuthClientRegistrationUpdateWithoutMcpServerInputSchema } from './OAuthClientRegistrationUpdateWithoutMcpServerInputSchema';
import { OAuthClientRegistrationUncheckedUpdateWithoutMcpServerInputSchema } from './OAuthClientRegistrationUncheckedUpdateWithoutMcpServerInputSchema';
import { OAuthClientRegistrationCreateWithoutMcpServerInputSchema } from './OAuthClientRegistrationCreateWithoutMcpServerInputSchema';
import { OAuthClientRegistrationUncheckedCreateWithoutMcpServerInputSchema } from './OAuthClientRegistrationUncheckedCreateWithoutMcpServerInputSchema';

export const OAuthClientRegistrationUpsertWithWhereUniqueWithoutMcpServerInputSchema: z.ZodType<Prisma.OAuthClientRegistrationUpsertWithWhereUniqueWithoutMcpServerInput> = z.strictObject({
  where: z.lazy(() => OAuthClientRegistrationWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => OAuthClientRegistrationUpdateWithoutMcpServerInputSchema), z.lazy(() => OAuthClientRegistrationUncheckedUpdateWithoutMcpServerInputSchema) ]),
  create: z.union([ z.lazy(() => OAuthClientRegistrationCreateWithoutMcpServerInputSchema), z.lazy(() => OAuthClientRegistrationUncheckedCreateWithoutMcpServerInputSchema) ]),
});

export default OAuthClientRegistrationUpsertWithWhereUniqueWithoutMcpServerInputSchema;
