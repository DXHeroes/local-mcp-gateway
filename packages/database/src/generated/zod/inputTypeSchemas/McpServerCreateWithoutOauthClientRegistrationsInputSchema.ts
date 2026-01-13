import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileMcpServerCreateNestedManyWithoutMcpServerInputSchema } from './ProfileMcpServerCreateNestedManyWithoutMcpServerInputSchema';
import { OAuthTokenCreateNestedOneWithoutMcpServerInputSchema } from './OAuthTokenCreateNestedOneWithoutMcpServerInputSchema';
import { McpServerToolsCacheCreateNestedManyWithoutMcpServerInputSchema } from './McpServerToolsCacheCreateNestedManyWithoutMcpServerInputSchema';
import { DebugLogCreateNestedManyWithoutMcpServerInputSchema } from './DebugLogCreateNestedManyWithoutMcpServerInputSchema';

export const McpServerCreateWithoutOauthClientRegistrationsInputSchema: z.ZodType<Prisma.McpServerCreateWithoutOauthClientRegistrationsInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  type: z.string(),
  config: z.string().optional(),
  oauthConfig: z.string().optional().nullable(),
  apiKeyConfig: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  profiles: z.lazy(() => ProfileMcpServerCreateNestedManyWithoutMcpServerInputSchema).optional(),
  oauthToken: z.lazy(() => OAuthTokenCreateNestedOneWithoutMcpServerInputSchema).optional(),
  toolsCache: z.lazy(() => McpServerToolsCacheCreateNestedManyWithoutMcpServerInputSchema).optional(),
  debugLogs: z.lazy(() => DebugLogCreateNestedManyWithoutMcpServerInputSchema).optional(),
});

export default McpServerCreateWithoutOauthClientRegistrationsInputSchema;
