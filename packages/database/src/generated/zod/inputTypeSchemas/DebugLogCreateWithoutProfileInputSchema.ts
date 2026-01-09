import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { McpServerCreateNestedOneWithoutDebugLogsInputSchema } from './McpServerCreateNestedOneWithoutDebugLogsInputSchema';

export const DebugLogCreateWithoutProfileInputSchema: z.ZodType<Prisma.DebugLogCreateWithoutProfileInput> = z.strictObject({
  id: z.uuid().optional(),
  requestType: z.string(),
  requestPayload: z.string(),
  responsePayload: z.string().optional().nullable(),
  status: z.string(),
  errorMessage: z.string().optional().nullable(),
  durationMs: z.number().int().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  mcpServer: z.lazy(() => McpServerCreateNestedOneWithoutDebugLogsInputSchema).optional(),
});

export default DebugLogCreateWithoutProfileInputSchema;
