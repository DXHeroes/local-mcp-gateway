import type { Prisma } from '../../prisma';

import { z } from 'zod';

export const McpServerToolsCacheUncheckedCreateWithoutMcpServerInputSchema: z.ZodType<Prisma.McpServerToolsCacheUncheckedCreateWithoutMcpServerInput> = z.strictObject({
  id: z.uuid().optional(),
  toolName: z.string(),
  description: z.string().optional().nullable(),
  inputSchema: z.string().optional().nullable(),
  schemaHash: z.string(),
  fetchedAt: z.coerce.date().optional(),
  createdAt: z.coerce.date().optional(),
});

export default McpServerToolsCacheUncheckedCreateWithoutMcpServerInputSchema;
