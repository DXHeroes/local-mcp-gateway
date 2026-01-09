import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { OAuthTokenIncludeSchema } from '../inputTypeSchemas/OAuthTokenIncludeSchema'
import { OAuthTokenUpdateInputSchema } from '../inputTypeSchemas/OAuthTokenUpdateInputSchema'
import { OAuthTokenUncheckedUpdateInputSchema } from '../inputTypeSchemas/OAuthTokenUncheckedUpdateInputSchema'
import { OAuthTokenWhereUniqueInputSchema } from '../inputTypeSchemas/OAuthTokenWhereUniqueInputSchema'
import { McpServerArgsSchema } from "../outputTypeSchemas/McpServerArgsSchema"
// Select schema needs to be in file to prevent circular imports
//------------------------------------------------------

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

export const OAuthTokenUpdateArgsSchema: z.ZodType<Prisma.OAuthTokenUpdateArgs> = z.object({
  select: OAuthTokenSelectSchema.optional(),
  include: z.lazy(() => OAuthTokenIncludeSchema).optional(),
  data: z.union([ OAuthTokenUpdateInputSchema, OAuthTokenUncheckedUpdateInputSchema ]),
  where: OAuthTokenWhereUniqueInputSchema, 
}).strict();

export default OAuthTokenUpdateArgsSchema;
