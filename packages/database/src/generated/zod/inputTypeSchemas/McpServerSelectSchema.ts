import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { ProfileMcpServerFindManyArgsSchema } from "../outputTypeSchemas/ProfileMcpServerFindManyArgsSchema"
import { OAuthTokenArgsSchema } from "../outputTypeSchemas/OAuthTokenArgsSchema"
import { OAuthClientRegistrationFindManyArgsSchema } from "../outputTypeSchemas/OAuthClientRegistrationFindManyArgsSchema"
import { McpServerToolsCacheFindManyArgsSchema } from "../outputTypeSchemas/McpServerToolsCacheFindManyArgsSchema"
import { DebugLogFindManyArgsSchema } from "../outputTypeSchemas/DebugLogFindManyArgsSchema"
import { McpServerCountOutputTypeArgsSchema } from "../outputTypeSchemas/McpServerCountOutputTypeArgsSchema"

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

export default McpServerSelectSchema;
