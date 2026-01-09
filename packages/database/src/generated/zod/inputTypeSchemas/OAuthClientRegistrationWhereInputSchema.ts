import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { StringFilterSchema } from './StringFilterSchema';
import { StringNullableFilterSchema } from './StringNullableFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';
import { McpServerScalarRelationFilterSchema } from './McpServerScalarRelationFilterSchema';
import { McpServerWhereInputSchema } from './McpServerWhereInputSchema';

export const OAuthClientRegistrationWhereInputSchema: z.ZodType<Prisma.OAuthClientRegistrationWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => OAuthClientRegistrationWhereInputSchema), z.lazy(() => OAuthClientRegistrationWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => OAuthClientRegistrationWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => OAuthClientRegistrationWhereInputSchema), z.lazy(() => OAuthClientRegistrationWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  mcpServerId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  authorizationServerUrl: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  clientId: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  clientSecret: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  registrationAccessToken: z.union([ z.lazy(() => StringNullableFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  mcpServer: z.union([ z.lazy(() => McpServerScalarRelationFilterSchema), z.lazy(() => McpServerWhereInputSchema) ]).optional(),
});

export default OAuthClientRegistrationWhereInputSchema;
