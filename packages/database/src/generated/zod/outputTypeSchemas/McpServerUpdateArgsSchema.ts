import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { McpServerIncludeSchema } from '../inputTypeSchemas/McpServerIncludeSchema'
import { McpServerUpdateInputSchema } from '../inputTypeSchemas/McpServerUpdateInputSchema'
import { McpServerUncheckedUpdateInputSchema } from '../inputTypeSchemas/McpServerUncheckedUpdateInputSchema'
import { McpServerWhereUniqueInputSchema } from '../inputTypeSchemas/McpServerWhereUniqueInputSchema'
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

export const McpServerUpdateArgsSchema: z.ZodType<Prisma.McpServerUpdateArgs> = z.object({
  select: McpServerSelectSchema.optional(),
  include: z.lazy(() => McpServerIncludeSchema).optional(),
  data: z.union([ McpServerUpdateInputSchema, McpServerUncheckedUpdateInputSchema ]),
  where: McpServerWhereUniqueInputSchema, 
}).strict();

export default McpServerUpdateArgsSchema;
