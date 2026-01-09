import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { OAuthClientRegistrationCreateManyMcpServerInputSchema } from './OAuthClientRegistrationCreateManyMcpServerInputSchema';

export const OAuthClientRegistrationCreateManyMcpServerInputEnvelopeSchema: z.ZodType<Prisma.OAuthClientRegistrationCreateManyMcpServerInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => OAuthClientRegistrationCreateManyMcpServerInputSchema), z.lazy(() => OAuthClientRegistrationCreateManyMcpServerInputSchema).array() ]),
});

export default OAuthClientRegistrationCreateManyMcpServerInputEnvelopeSchema;
