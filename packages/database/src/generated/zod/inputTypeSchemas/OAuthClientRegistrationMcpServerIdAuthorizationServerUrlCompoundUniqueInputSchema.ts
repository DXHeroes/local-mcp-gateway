import type { Prisma } from '../../prisma';

import { z } from 'zod';

export const OAuthClientRegistrationMcpServerIdAuthorizationServerUrlCompoundUniqueInputSchema: z.ZodType<Prisma.OAuthClientRegistrationMcpServerIdAuthorizationServerUrlCompoundUniqueInput> = z.strictObject({
  mcpServerId: z.string(),
  authorizationServerUrl: z.string(),
});

export default OAuthClientRegistrationMcpServerIdAuthorizationServerUrlCompoundUniqueInputSchema;
