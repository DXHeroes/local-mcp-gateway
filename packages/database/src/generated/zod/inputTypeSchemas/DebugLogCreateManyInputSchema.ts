import type { Prisma } from '../../prisma';

import { z } from 'zod';

export const DebugLogCreateManyInputSchema: z.ZodType<Prisma.DebugLogCreateManyInput> = z.strictObject({
  id: z.uuid().optional(),
  profileId: z.string(),
  mcpServerId: z.string().optional().nullable(),
  requestType: z.string(),
  requestPayload: z.string(),
  responsePayload: z.string().optional().nullable(),
  status: z.string(),
  errorMessage: z.string().optional().nullable(),
  durationMs: z.number().int().optional().nullable(),
  createdAt: z.coerce.date().optional(),
});

export default DebugLogCreateManyInputSchema;
