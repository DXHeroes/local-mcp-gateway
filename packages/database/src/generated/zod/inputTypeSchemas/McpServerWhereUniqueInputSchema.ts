import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { McpServerWhereInputSchema } from './McpServerWhereInputSchema';
import { StringFilterSchema } from './StringFilterSchema';
import { StringNullableFilterSchema } from './StringNullableFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';
import { UserScalarRelationFilterSchema } from './UserScalarRelationFilterSchema';
import { UserWhereInputSchema } from './UserWhereInputSchema';
import { ProfileMcpServerListRelationFilterSchema } from './ProfileMcpServerListRelationFilterSchema';
import { OAuthTokenNullableScalarRelationFilterSchema } from './OAuthTokenNullableScalarRelationFilterSchema';
import { OAuthTokenWhereInputSchema } from './OAuthTokenWhereInputSchema';
import { OAuthClientRegistrationListRelationFilterSchema } from './OAuthClientRegistrationListRelationFilterSchema';
import { McpServerToolsCacheListRelationFilterSchema } from './McpServerToolsCacheListRelationFilterSchema';
import { McpServerToolConfigListRelationFilterSchema } from './McpServerToolConfigListRelationFilterSchema';
import { DebugLogListRelationFilterSchema } from './DebugLogListRelationFilterSchema';

export const McpServerWhereUniqueInputSchema: z.ZodType<Prisma.McpServerWhereUniqueInput> = z.object({
  id: z.uuid(),
})
.and(z.strictObject({
  id: z.uuid().optional(),
  AND: z.union([ z.lazy(() => McpServerWhereInputSchema), z.lazy(() => McpServerWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => McpServerWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => McpServerWhereInputSchema), z.lazy(() => McpServerWhereInputSchema).array() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  type: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  config: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  oauthConfig: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  apiKeyConfig: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  userId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  presetId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional(),
  profiles: z.lazy(() => ProfileMcpServerListRelationFilterSchema).optional(),
  oauthToken: z.union([ z.lazy(() => OAuthTokenNullableScalarRelationFilterSchema), z.lazy(() => OAuthTokenWhereInputSchema) ]).optional().nullable(),
  oauthClientRegistrations: z.lazy(() => OAuthClientRegistrationListRelationFilterSchema).optional(),
  toolsCache: z.lazy(() => McpServerToolsCacheListRelationFilterSchema).optional(),
  toolConfigs: z.lazy(() => McpServerToolConfigListRelationFilterSchema).optional(),
  debugLogs: z.lazy(() => DebugLogListRelationFilterSchema).optional(),
}));

export default McpServerWhereUniqueInputSchema;
