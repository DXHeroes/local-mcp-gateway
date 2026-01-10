import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileCreateNestedOneWithoutDebugLogsInputSchema } from './ProfileCreateNestedOneWithoutDebugLogsInputSchema';

export const DebugLogCreateWithoutMcpServerInputSchema: z.ZodType<Prisma.DebugLogCreateWithoutMcpServerInput> = z.strictObject({
  id: z.uuid().optional(),
  requestType: z.string(),
  requestPayload: z.string(),
  responsePayload: z.string().optional().nullable(),
  status: z.string(),
  errorMessage: z.string().optional().nullable(),
  durationMs: z.number().int().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  profile: z.lazy(() => ProfileCreateNestedOneWithoutDebugLogsInputSchema).optional(),
});

export default DebugLogCreateWithoutMcpServerInputSchema;
