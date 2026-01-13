import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { StringFieldUpdateOperationsInputSchema } from './StringFieldUpdateOperationsInputSchema';
import { NullableStringFieldUpdateOperationsInputSchema } from './NullableStringFieldUpdateOperationsInputSchema';
import { DateTimeFieldUpdateOperationsInputSchema } from './DateTimeFieldUpdateOperationsInputSchema';
import { OAuthTokenUpdateOneWithoutMcpServerNestedInputSchema } from './OAuthTokenUpdateOneWithoutMcpServerNestedInputSchema';
import { OAuthClientRegistrationUpdateManyWithoutMcpServerNestedInputSchema } from './OAuthClientRegistrationUpdateManyWithoutMcpServerNestedInputSchema';
import { McpServerToolsCacheUpdateManyWithoutMcpServerNestedInputSchema } from './McpServerToolsCacheUpdateManyWithoutMcpServerNestedInputSchema';
import { DebugLogUpdateManyWithoutMcpServerNestedInputSchema } from './DebugLogUpdateManyWithoutMcpServerNestedInputSchema';

export const McpServerUpdateWithoutProfilesInputSchema: z.ZodType<Prisma.McpServerUpdateWithoutProfilesInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  config: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  oauthConfig: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  apiKeyConfig: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  oauthToken: z.lazy(() => OAuthTokenUpdateOneWithoutMcpServerNestedInputSchema).optional(),
  oauthClientRegistrations: z.lazy(() => OAuthClientRegistrationUpdateManyWithoutMcpServerNestedInputSchema).optional(),
  toolsCache: z.lazy(() => McpServerToolsCacheUpdateManyWithoutMcpServerNestedInputSchema).optional(),
  debugLogs: z.lazy(() => DebugLogUpdateManyWithoutMcpServerNestedInputSchema).optional(),
});

export default McpServerUpdateWithoutProfilesInputSchema;
