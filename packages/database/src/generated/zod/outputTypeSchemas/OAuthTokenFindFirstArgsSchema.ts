import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { OAuthTokenIncludeSchema } from '../inputTypeSchemas/OAuthTokenIncludeSchema'
import { OAuthTokenWhereInputSchema } from '../inputTypeSchemas/OAuthTokenWhereInputSchema'
import { OAuthTokenOrderByWithRelationInputSchema } from '../inputTypeSchemas/OAuthTokenOrderByWithRelationInputSchema'
import { OAuthTokenWhereUniqueInputSchema } from '../inputTypeSchemas/OAuthTokenWhereUniqueInputSchema'
import { OAuthTokenScalarFieldEnumSchema } from '../inputTypeSchemas/OAuthTokenScalarFieldEnumSchema'
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

export const OAuthTokenFindFirstArgsSchema: z.ZodType<Prisma.OAuthTokenFindFirstArgs> = z.object({
  select: OAuthTokenSelectSchema.optional(),
  include: z.lazy(() => OAuthTokenIncludeSchema).optional(),
  where: OAuthTokenWhereInputSchema.optional(), 
  orderBy: z.union([ OAuthTokenOrderByWithRelationInputSchema.array(), OAuthTokenOrderByWithRelationInputSchema ]).optional(),
  cursor: OAuthTokenWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ OAuthTokenScalarFieldEnumSchema, OAuthTokenScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export default OAuthTokenFindFirstArgsSchema;
