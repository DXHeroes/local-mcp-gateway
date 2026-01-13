import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { OAuthClientRegistrationScalarWhereInputSchema } from './OAuthClientRegistrationScalarWhereInputSchema';
import { OAuthClientRegistrationUpdateManyMutationInputSchema } from './OAuthClientRegistrationUpdateManyMutationInputSchema';
import { OAuthClientRegistrationUncheckedUpdateManyWithoutMcpServerInputSchema } from './OAuthClientRegistrationUncheckedUpdateManyWithoutMcpServerInputSchema';

export const OAuthClientRegistrationUpdateManyWithWhereWithoutMcpServerInputSchema: z.ZodType<Prisma.OAuthClientRegistrationUpdateManyWithWhereWithoutMcpServerInput> = z.strictObject({
  where: z.lazy(() => OAuthClientRegistrationScalarWhereInputSchema),
  data: z.union([ z.lazy(() => OAuthClientRegistrationUpdateManyMutationInputSchema), z.lazy(() => OAuthClientRegistrationUncheckedUpdateManyWithoutMcpServerInputSchema) ]),
});

export default OAuthClientRegistrationUpdateManyWithWhereWithoutMcpServerInputSchema;
