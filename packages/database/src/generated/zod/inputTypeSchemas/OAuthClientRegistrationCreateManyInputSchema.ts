import type { Prisma } from '../../prisma';

import { z } from 'zod';

export const OAuthClientRegistrationCreateManyInputSchema: z.ZodType<Prisma.OAuthClientRegistrationCreateManyInput> = z.strictObject({
  id: z.uuid().optional(),
  mcpServerId: z.string(),
  authorizationServerUrl: z.string(),
  clientId: z.string(),
  clientSecret: z.string().optional().nullable(),
  registrationAccessToken: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export default OAuthClientRegistrationCreateManyInputSchema;
