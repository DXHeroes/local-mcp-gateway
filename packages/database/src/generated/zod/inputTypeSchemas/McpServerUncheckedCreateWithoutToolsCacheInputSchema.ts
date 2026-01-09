import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileMcpServerUncheckedCreateNestedManyWithoutMcpServerInputSchema } from './ProfileMcpServerUncheckedCreateNestedManyWithoutMcpServerInputSchema';
import { OAuthTokenUncheckedCreateNestedOneWithoutMcpServerInputSchema } from './OAuthTokenUncheckedCreateNestedOneWithoutMcpServerInputSchema';
import { OAuthClientRegistrationUncheckedCreateNestedManyWithoutMcpServerInputSchema } from './OAuthClientRegistrationUncheckedCreateNestedManyWithoutMcpServerInputSchema';
import { DebugLogUncheckedCreateNestedManyWithoutMcpServerInputSchema } from './DebugLogUncheckedCreateNestedManyWithoutMcpServerInputSchema';

export const McpServerUncheckedCreateWithoutToolsCacheInputSchema: z.ZodType<Prisma.McpServerUncheckedCreateWithoutToolsCacheInput> = z.strictObject({
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
  oauthClientRegistrations: z.lazy(() => OAuthClientRegistrationUncheckedCreateNestedManyWithoutMcpServerInputSchema).optional(),
  debugLogs: z.lazy(() => DebugLogUncheckedCreateNestedManyWithoutMcpServerInputSchema).optional(),
});

export default McpServerUncheckedCreateWithoutToolsCacheInputSchema;
