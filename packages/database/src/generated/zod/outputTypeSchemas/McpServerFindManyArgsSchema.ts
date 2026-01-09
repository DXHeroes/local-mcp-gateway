import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { McpServerIncludeSchema } from '../inputTypeSchemas/McpServerIncludeSchema'
import { McpServerWhereInputSchema } from '../inputTypeSchemas/McpServerWhereInputSchema'
import { McpServerOrderByWithRelationInputSchema } from '../inputTypeSchemas/McpServerOrderByWithRelationInputSchema'
import { McpServerWhereUniqueInputSchema } from '../inputTypeSchemas/McpServerWhereUniqueInputSchema'
import { McpServerScalarFieldEnumSchema } from '../inputTypeSchemas/McpServerScalarFieldEnumSchema'
import { ProfileMcpServerFindManyArgsSchema } from "../outputTypeSchemas/ProfileMcpServerFindManyArgsSchema"
import { OAuthTokenArgsSchema } from "../outputTypeSchemas/OAuthTokenArgsSchema"
import { OAuthClientRegistrationFindManyArgsSchema } from "../outputTypeSchemas/OAuthClientRegistrationFindManyArgsSchema"
import { McpServerToolsCacheFindManyArgsSchema } from "../outputTypeSchemas/McpServerToolsCacheFindManyArgsSchema"
import { DebugLogFindManyArgsSchema } from "../outputTypeSchemas/DebugLogFindManyArgsSchema"
import { McpServerCountOutputTypeArgsSchema } from "../outputTypeSchemas/McpServerCountOutputTypeArgsSchema"
// Select schema needs to be in file to prevent circular imports
//------------------------------------------------------

export const McpServerSelectSchema: z.ZodType<Prisma.McpServerSelect> = z.object({
  id: z.boolean().optional(),
  name: z.boolean().optional(),
  type: z.boolean().optional(),
  config: z.boolean().optional(),
  oauthConfig: z.boolean().optional(),
  apiKeyConfig: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  profiles: z.union([z.boolean(),z.lazy(() => ProfileMcpServerFindManyArgsSchema)]).optional(),
  oauthToken: z.union([z.boolean(),z.lazy(() => OAuthTokenArgsSchema)]).optional(),
  oauthClientRegistrations: z.union([z.boolean(),z.lazy(() => OAuthClientRegistrationFindManyArgsSchema)]).optional(),
  toolsCache: z.union([z.boolean(),z.lazy(() => McpServerToolsCacheFindManyArgsSchema)]).optional(),
  debugLogs: z.union([z.boolean(),z.lazy(() => DebugLogFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => McpServerCountOutputTypeArgsSchema)]).optional(),
}).strict()

export const McpServerFindManyArgsSchema: z.ZodType<Prisma.McpServerFindManyArgs> = z.object({
  select: McpServerSelectSchema.optional(),
  include: z.lazy(() => McpServerIncludeSchema).optional(),
  where: McpServerWhereInputSchema.optional(), 
  orderBy: z.union([ McpServerOrderByWithRelationInputSchema.array(), McpServerOrderByWithRelationInputSchema ]).optional(),
  cursor: McpServerWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ McpServerScalarFieldEnumSchema, McpServerScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export default McpServerFindManyArgsSchema;
