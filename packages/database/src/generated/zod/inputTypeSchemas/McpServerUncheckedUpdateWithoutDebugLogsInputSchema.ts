import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { StringFieldUpdateOperationsInputSchema } from './StringFieldUpdateOperationsInputSchema';
import { NullableStringFieldUpdateOperationsInputSchema } from './NullableStringFieldUpdateOperationsInputSchema';
import { DateTimeFieldUpdateOperationsInputSchema } from './DateTimeFieldUpdateOperationsInputSchema';
import { ProfileMcpServerUncheckedUpdateManyWithoutMcpServerNestedInputSchema } from './ProfileMcpServerUncheckedUpdateManyWithoutMcpServerNestedInputSchema';
import { OAuthTokenUncheckedUpdateOneWithoutMcpServerNestedInputSchema } from './OAuthTokenUncheckedUpdateOneWithoutMcpServerNestedInputSchema';
import { OAuthClientRegistrationUncheckedUpdateManyWithoutMcpServerNestedInputSchema } from './OAuthClientRegistrationUncheckedUpdateManyWithoutMcpServerNestedInputSchema';
import { McpServerToolsCacheUncheckedUpdateManyWithoutMcpServerNestedInputSchema } from './McpServerToolsCacheUncheckedUpdateManyWithoutMcpServerNestedInputSchema';

export const McpServerUncheckedUpdateWithoutDebugLogsInputSchema: z.ZodType<Prisma.McpServerUncheckedUpdateWithoutDebugLogsInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  config: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  oauthConfig: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  apiKeyConfig: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  profiles: z.lazy(() => ProfileMcpServerUncheckedUpdateManyWithoutMcpServerNestedInputSchema).optional(),
  oauthToken: z.lazy(() => OAuthTokenUncheckedUpdateOneWithoutMcpServerNestedInputSchema).optional(),
  oauthClientRegistrations: z.lazy(() => OAuthClientRegistrationUncheckedUpdateManyWithoutMcpServerNestedInputSchema).optional(),
  toolsCache: z.lazy(() => McpServerToolsCacheUncheckedUpdateManyWithoutMcpServerNestedInputSchema).optional(),
});

export default McpServerUncheckedUpdateWithoutDebugLogsInputSchema;
