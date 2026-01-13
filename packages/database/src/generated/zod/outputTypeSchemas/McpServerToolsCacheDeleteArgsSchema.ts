import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { McpServerToolsCacheIncludeSchema } from '../inputTypeSchemas/McpServerToolsCacheIncludeSchema'
import { McpServerToolsCacheWhereUniqueInputSchema } from '../inputTypeSchemas/McpServerToolsCacheWhereUniqueInputSchema'
import { McpServerArgsSchema } from "../outputTypeSchemas/McpServerArgsSchema"
// Select schema needs to be in file to prevent circular imports
//------------------------------------------------------

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

export const McpServerToolsCacheDeleteArgsSchema: z.ZodType<Prisma.McpServerToolsCacheDeleteArgs> = z.object({
  select: McpServerToolsCacheSelectSchema.optional(),
  include: z.lazy(() => McpServerToolsCacheIncludeSchema).optional(),
  where: McpServerToolsCacheWhereUniqueInputSchema, 
}).strict();

export default McpServerToolsCacheDeleteArgsSchema;
