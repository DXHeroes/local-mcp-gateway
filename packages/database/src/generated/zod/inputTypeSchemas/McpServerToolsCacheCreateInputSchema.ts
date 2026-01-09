import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { McpServerCreateNestedOneWithoutToolsCacheInputSchema } from './McpServerCreateNestedOneWithoutToolsCacheInputSchema';

export const McpServerToolsCacheCreateInputSchema: z.ZodType<Prisma.McpServerToolsCacheCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  toolName: z.string(),
  description: z.string().optional().nullable(),
  inputSchema: z.string().optional().nullable(),
  schemaHash: z.string(),
  fetchedAt: z.coerce.date().optional(),
  createdAt: z.coerce.date().optional(),
  mcpServer: z.lazy(() => McpServerCreateNestedOneWithoutToolsCacheInputSchema),
});

export default McpServerToolsCacheCreateInputSchema;
