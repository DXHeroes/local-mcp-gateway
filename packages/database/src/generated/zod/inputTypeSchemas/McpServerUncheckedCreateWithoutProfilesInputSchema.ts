import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { OAuthTokenUncheckedCreateNestedOneWithoutMcpServerInputSchema } from './OAuthTokenUncheckedCreateNestedOneWithoutMcpServerInputSchema';
import { OAuthClientRegistrationUncheckedCreateNestedManyWithoutMcpServerInputSchema } from './OAuthClientRegistrationUncheckedCreateNestedManyWithoutMcpServerInputSchema';
import { McpServerToolsCacheUncheckedCreateNestedManyWithoutMcpServerInputSchema } from './McpServerToolsCacheUncheckedCreateNestedManyWithoutMcpServerInputSchema';
import { DebugLogUncheckedCreateNestedManyWithoutMcpServerInputSchema } from './DebugLogUncheckedCreateNestedManyWithoutMcpServerInputSchema';

export const McpServerUncheckedCreateWithoutProfilesInputSchema: z.ZodType<Prisma.McpServerUncheckedCreateWithoutProfilesInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  type: z.string(),
  config: z.string().optional(),
  oauthConfig: z.string().optional().nullable(),
  apiKeyConfig: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  oauthToken: z.lazy(() => OAuthTokenUncheckedCreateNestedOneWithoutMcpServerInputSchema).optional(),
  oauthClientRegistrations: z.lazy(() => OAuthClientRegistrationUncheckedCreateNestedManyWithoutMcpServerInputSchema).optional(),
  toolsCache: z.lazy(() => McpServerToolsCacheUncheckedCreateNestedManyWithoutMcpServerInputSchema).optional(),
  debugLogs: z.lazy(() => DebugLogUncheckedCreateNestedManyWithoutMcpServerInputSchema).optional(),
});

export default McpServerUncheckedCreateWithoutProfilesInputSchema;
