import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { McpServerArgsSchema } from "../outputTypeSchemas/McpServerArgsSchema"

export const McpServerToolsCacheIncludeSchema: z.ZodType<Prisma.McpServerToolsCacheInclude> = z.object({
  mcpServer: z.union([z.boolean(),z.lazy(() => McpServerArgsSchema)]).optional(),
}).strict();

export default McpServerToolsCacheIncludeSchema;
