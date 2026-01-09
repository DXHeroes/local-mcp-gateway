import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileCreateNestedOneWithoutDebugLogsInputSchema } from './ProfileCreateNestedOneWithoutDebugLogsInputSchema';
import { McpServerCreateNestedOneWithoutDebugLogsInputSchema } from './McpServerCreateNestedOneWithoutDebugLogsInputSchema';

export const DebugLogCreateInputSchema: z.ZodType<Prisma.DebugLogCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  requestType: z.string(),
  requestPayload: z.string(),
  responsePayload: z.string().optional().nullable(),
  status: z.string(),
  errorMessage: z.string().optional().nullable(),
  durationMs: z.number().int().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  profile: z.lazy(() => ProfileCreateNestedOneWithoutDebugLogsInputSchema),
  mcpServer: z.lazy(() => McpServerCreateNestedOneWithoutDebugLogsInputSchema).optional(),
});

export default DebugLogCreateInputSchema;
