import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { McpServerArgsSchema } from "../outputTypeSchemas/McpServerArgsSchema"

export const OAuthTokenSelectSchema: z.ZodType<Prisma.OAuthTokenSelect> = z.object({
  id: z.boolean().optional(),
  mcpServerId: z.boolean().optional(),
  accessToken: z.boolean().optional(),
  refreshToken: z.boolean().optional(),
  tokenType: z.boolean().optional(),
  scope: z.boolean().optional(),
  expiresAt: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  mcpServer: z.union([z.boolean(),z.lazy(() => McpServerArgsSchema)]).optional(),
}).strict()

export default OAuthTokenSelectSchema;
