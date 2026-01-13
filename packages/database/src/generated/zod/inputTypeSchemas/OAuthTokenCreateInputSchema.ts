import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { McpServerCreateNestedOneWithoutOauthTokenInputSchema } from './McpServerCreateNestedOneWithoutOauthTokenInputSchema';

export const OAuthTokenCreateInputSchema: z.ZodType<Prisma.OAuthTokenCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  accessToken: z.string(),
  refreshToken: z.string().optional().nullable(),
  tokenType: z.string().optional(),
  scope: z.string().optional().nullable(),
  expiresAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  mcpServer: z.lazy(() => McpServerCreateNestedOneWithoutOauthTokenInputSchema),
});

export default OAuthTokenCreateInputSchema;
