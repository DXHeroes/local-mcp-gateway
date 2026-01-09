import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { OAuthTokenCreateNestedOneWithoutMcpServerInputSchema } from './OAuthTokenCreateNestedOneWithoutMcpServerInputSchema';
import { OAuthClientRegistrationCreateNestedManyWithoutMcpServerInputSchema } from './OAuthClientRegistrationCreateNestedManyWithoutMcpServerInputSchema';
import { McpServerToolsCacheCreateNestedManyWithoutMcpServerInputSchema } from './McpServerToolsCacheCreateNestedManyWithoutMcpServerInputSchema';
import { DebugLogCreateNestedManyWithoutMcpServerInputSchema } from './DebugLogCreateNestedManyWithoutMcpServerInputSchema';

export const McpServerCreateWithoutProfilesInputSchema: z.ZodType<Prisma.McpServerCreateWithoutProfilesInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  type: z.string(),
  config: z.string().optional(),
  oauthConfig: z.string().optional().nullable(),
  apiKeyConfig: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  oauthToken: z.lazy(() => OAuthTokenCreateNestedOneWithoutMcpServerInputSchema).optional(),
  oauthClientRegistrations: z.lazy(() => OAuthClientRegistrationCreateNestedManyWithoutMcpServerInputSchema).optional(),
  toolsCache: z.lazy(() => McpServerToolsCacheCreateNestedManyWithoutMcpServerInputSchema).optional(),
  debugLogs: z.lazy(() => DebugLogCreateNestedManyWithoutMcpServerInputSchema).optional(),
});

export default McpServerCreateWithoutProfilesInputSchema;
