import type { Prisma } from '../../prisma';

import { z } from 'zod';

export const OAuthClientRegistrationCreateManyMcpServerInputSchema: z.ZodType<Prisma.OAuthClientRegistrationCreateManyMcpServerInput> = z.strictObject({
  id: z.uuid().optional(),
  authorizationServerUrl: z.string(),
  clientId: z.string(),
  clientSecret: z.string().optional().nullable(),
  registrationAccessToken: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export default OAuthClientRegistrationCreateManyMcpServerInputSchema;
