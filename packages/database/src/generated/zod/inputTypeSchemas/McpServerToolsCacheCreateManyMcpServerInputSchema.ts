import type { Prisma } from '../../prisma';

import { z } from 'zod';

export const McpServerToolsCacheCreateManyMcpServerInputSchema: z.ZodType<Prisma.McpServerToolsCacheCreateManyMcpServerInput> = z.strictObject({
  id: z.uuid().optional(),
  toolName: z.string(),
  description: z.string().optional().nullable(),
  inputSchema: z.string().optional().nullable(),
  schemaHash: z.string(),
  fetchedAt: z.coerce.date().optional(),
  createdAt: z.coerce.date().optional(),
});

export default McpServerToolsCacheCreateManyMcpServerInputSchema;
