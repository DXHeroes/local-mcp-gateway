import type { Prisma } from '../../prisma';

import { z } from 'zod';

export const McpServerToolsCacheUncheckedCreateInputSchema: z.ZodType<Prisma.McpServerToolsCacheUncheckedCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  mcpServerId: z.string(),
  toolName: z.string(),
  description: z.string().optional().nullable(),
  inputSchema: z.string().optional().nullable(),
  schemaHash: z.string(),
  fetchedAt: z.coerce.date().optional(),
  createdAt: z.coerce.date().optional(),
});

export default McpServerToolsCacheUncheckedCreateInputSchema;
