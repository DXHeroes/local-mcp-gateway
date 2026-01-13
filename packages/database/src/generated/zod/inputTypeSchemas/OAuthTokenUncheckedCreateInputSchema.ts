import type { Prisma } from '../../prisma';

import { z } from 'zod';

export const OAuthTokenUncheckedCreateInputSchema: z.ZodType<Prisma.OAuthTokenUncheckedCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  mcpServerId: z.string(),
  accessToken: z.string(),
  refreshToken: z.string().optional().nullable(),
  tokenType: z.string().optional(),
  scope: z.string().optional().nullable(),
  expiresAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export default OAuthTokenUncheckedCreateInputSchema;
