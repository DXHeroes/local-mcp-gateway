import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { StringFilterSchema } from './StringFilterSchema';
import { StringNullableFilterSchema } from './StringNullableFilterSchema';
import { DateTimeNullableFilterSchema } from './DateTimeNullableFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';
import { McpServerScalarRelationFilterSchema } from './McpServerScalarRelationFilterSchema';
import { McpServerWhereInputSchema } from './McpServerWhereInputSchema';

export const OAuthTokenWhereInputSchema: z.ZodType<Prisma.OAuthTokenWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => OAuthTokenWhereInputSchema), z.lazy(() => OAuthTokenWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => OAuthTokenWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => OAuthTokenWhereInputSchema), z.lazy(() => OAuthTokenWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  mcpServerId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  accessToken: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  refreshToken: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  tokenType: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  scope: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  expiresAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  mcpServer: z.union([ z.lazy(() => McpServerScalarRelationFilterSchema), z.lazy(() => McpServerWhereInputSchema) ]).optional(),
});

export default OAuthTokenWhereInputSchema;
