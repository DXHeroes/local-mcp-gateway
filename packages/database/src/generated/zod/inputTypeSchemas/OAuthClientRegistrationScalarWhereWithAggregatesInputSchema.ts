import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { StringWithAggregatesFilterSchema } from './StringWithAggregatesFilterSchema';
import { StringNullableWithAggregatesFilterSchema } from './StringNullableWithAggregatesFilterSchema';
import { DateTimeWithAggregatesFilterSchema } from './DateTimeWithAggregatesFilterSchema';

export const OAuthClientRegistrationScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.OAuthClientRegistrationScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => OAuthClientRegistrationScalarWhereWithAggregatesInputSchema), z.lazy(() => OAuthClientRegistrationScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => OAuthClientRegistrationScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => OAuthClientRegistrationScalarWhereWithAggregatesInputSchema), z.lazy(() => OAuthClientRegistrationScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  mcpServerId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  authorizationServerUrl: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  clientId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  clientSecret: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  registrationAccessToken: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema), z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export default OAuthClientRegistrationScalarWhereWithAggregatesInputSchema;
