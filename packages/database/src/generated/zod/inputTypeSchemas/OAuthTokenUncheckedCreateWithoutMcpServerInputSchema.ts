import type { Prisma } from '../../prisma';

import { z } from 'zod';

export const OAuthTokenUncheckedCreateWithoutMcpServerInputSchema: z.ZodType<Prisma.OAuthTokenUncheckedCreateWithoutMcpServerInput> = z.strictObject({
  id: z.uuid().optional(),
  accessToken: z.string(),
  refreshToken: z.string().optional().nullable(),
  tokenType: z.string().optional(),
  scope: z.string().optional().nullable(),
  expiresAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export default OAuthTokenUncheckedCreateWithoutMcpServerInputSchema;
