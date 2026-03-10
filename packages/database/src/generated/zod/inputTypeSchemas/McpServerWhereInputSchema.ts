import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { StringFilterSchema } from './StringFilterSchema';
import { StringNullableFilterSchema } from './StringNullableFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';
import { UserNullableScalarRelationFilterSchema } from './UserNullableScalarRelationFilterSchema';
import { UserWhereInputSchema } from './UserWhereInputSchema';
import { OrganizationNullableScalarRelationFilterSchema } from './OrganizationNullableScalarRelationFilterSchema';
import { OrganizationWhereInputSchema } from './OrganizationWhereInputSchema';
import { ProfileMcpServerListRelationFilterSchema } from './ProfileMcpServerListRelationFilterSchema';
import { OAuthTokenNullableScalarRelationFilterSchema } from './OAuthTokenNullableScalarRelationFilterSchema';
import { OAuthTokenWhereInputSchema } from './OAuthTokenWhereInputSchema';
import { OAuthClientRegistrationListRelationFilterSchema } from './OAuthClientRegistrationListRelationFilterSchema';
import { McpServerToolsCacheListRelationFilterSchema } from './McpServerToolsCacheListRelationFilterSchema';
import { DebugLogListRelationFilterSchema } from './DebugLogListRelationFilterSchema';

export const McpServerWhereInputSchema: z.ZodType<Prisma.McpServerWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => McpServerWhereInputSchema), z.lazy(() => McpServerWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => McpServerWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => McpServerWhereInputSchema), z.lazy(() => McpServerWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  type: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  config: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  oauthConfig: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  apiKeyConfig: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  userId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  organizationId: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  user: z.union([ z.lazy(() => UserNullableScalarRelationFilterSchema), z.lazy(() => UserWhereInputSchema) ]).optional().nullable(),
  organization: z.union([ z.lazy(() => OrganizationNullableScalarRelationFilterSchema), z.lazy(() => OrganizationWhereInputSchema) ]).optional().nullable(),
  profiles: z.lazy(() => ProfileMcpServerListRelationFilterSchema).optional(),
  oauthToken: z.union([ z.lazy(() => OAuthTokenNullableScalarRelationFilterSchema), z.lazy(() => OAuthTokenWhereInputSchema) ]).optional().nullable(),
  oauthClientRegistrations: z.lazy(() => OAuthClientRegistrationListRelationFilterSchema).optional(),
  toolsCache: z.lazy(() => McpServerToolsCacheListRelationFilterSchema).optional(),
  debugLogs: z.lazy(() => DebugLogListRelationFilterSchema).optional(),
});

export default McpServerWhereInputSchema;
