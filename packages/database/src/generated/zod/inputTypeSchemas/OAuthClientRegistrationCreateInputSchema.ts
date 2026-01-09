import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { McpServerCreateNestedOneWithoutOauthClientRegistrationsInputSchema } from './McpServerCreateNestedOneWithoutOauthClientRegistrationsInputSchema';

export const OAuthClientRegistrationCreateInputSchema: z.ZodType<Prisma.OAuthClientRegistrationCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  authorizationServerUrl: z.string(),
  clientId: z.string(),
  clientSecret: z.string().optional().nullable(),
  registrationAccessToken: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  mcpServer: z.lazy(() => McpServerCreateNestedOneWithoutOauthClientRegistrationsInputSchema),
});

export default OAuthClientRegistrationCreateInputSchema;
