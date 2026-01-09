import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { OAuthClientRegistrationWhereUniqueInputSchema } from './OAuthClientRegistrationWhereUniqueInputSchema';
import { OAuthClientRegistrationUpdateWithoutMcpServerInputSchema } from './OAuthClientRegistrationUpdateWithoutMcpServerInputSchema';
import { OAuthClientRegistrationUncheckedUpdateWithoutMcpServerInputSchema } from './OAuthClientRegistrationUncheckedUpdateWithoutMcpServerInputSchema';

export const OAuthClientRegistrationUpdateWithWhereUniqueWithoutMcpServerInputSchema: z.ZodType<Prisma.OAuthClientRegistrationUpdateWithWhereUniqueWithoutMcpServerInput> = z.strictObject({
  where: z.lazy(() => OAuthClientRegistrationWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => OAuthClientRegistrationUpdateWithoutMcpServerInputSchema), z.lazy(() => OAuthClientRegistrationUncheckedUpdateWithoutMcpServerInputSchema) ]),
});

export default OAuthClientRegistrationUpdateWithWhereUniqueWithoutMcpServerInputSchema;
