import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileMcpServerUncheckedCreateNestedManyWithoutMcpServerInputSchema } from './ProfileMcpServerUncheckedCreateNestedManyWithoutMcpServerInputSchema';
import { OAuthTokenUncheckedCreateNestedOneWithoutMcpServerInputSchema } from './OAuthTokenUncheckedCreateNestedOneWithoutMcpServerInputSchema';
import { McpServerToolsCacheUncheckedCreateNestedManyWithoutMcpServerInputSchema } from './McpServerToolsCacheUncheckedCreateNestedManyWithoutMcpServerInputSchema';
import { DebugLogUncheckedCreateNestedManyWithoutMcpServerInputSchema } from './DebugLogUncheckedCreateNestedManyWithoutMcpServerInputSchema';

export const McpServerUncheckedCreateWithoutOauthClientRegistrationsInputSchema: z.ZodType<Prisma.McpServerUncheckedCreateWithoutOauthClientRegistrationsInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  type: z.string(),
  config: z.string().optional(),
  oauthConfig: z.string().optional().nullable(),
  apiKeyConfig: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  profiles: z.lazy(() => ProfileMcpServerUncheckedCreateNestedManyWithoutMcpServerInputSchema).optional(),
  oauthToken: z.lazy(() => OAuthTokenUncheckedCreateNestedOneWithoutMcpServerInputSchema).optional(),
  toolsCache: z.lazy(() => McpServerToolsCacheUncheckedCreateNestedManyWithoutMcpServerInputSchema).optional(),
  debugLogs: z.lazy(() => DebugLogUncheckedCreateNestedManyWithoutMcpServerInputSchema).optional(),
});

export default McpServerUncheckedCreateWithoutOauthClientRegistrationsInputSchema;
