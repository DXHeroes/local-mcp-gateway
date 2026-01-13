import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { McpServerArgsSchema } from "../outputTypeSchemas/McpServerArgsSchema"

export const McpServerToolsCacheSelectSchema: z.ZodType<Prisma.McpServerToolsCacheSelect> = z.object({
  id: z.boolean().optional(),
  mcpServerId: z.boolean().optional(),
  toolName: z.boolean().optional(),
  description: z.boolean().optional(),
  inputSchema: z.boolean().optional(),
  schemaHash: z.boolean().optional(),
  fetchedAt: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  mcpServer: z.union([z.boolean(),z.lazy(() => McpServerArgsSchema)]).optional(),
}).strict()

export default McpServerToolsCacheSelectSchema;
