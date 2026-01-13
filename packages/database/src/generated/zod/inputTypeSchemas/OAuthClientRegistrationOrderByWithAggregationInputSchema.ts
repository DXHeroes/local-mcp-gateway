import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { SortOrderInputSchema } from './SortOrderInputSchema';
import { OAuthClientRegistrationCountOrderByAggregateInputSchema } from './OAuthClientRegistrationCountOrderByAggregateInputSchema';
import { OAuthClientRegistrationMaxOrderByAggregateInputSchema } from './OAuthClientRegistrationMaxOrderByAggregateInputSchema';
import { OAuthClientRegistrationMinOrderByAggregateInputSchema } from './OAuthClientRegistrationMinOrderByAggregateInputSchema';

export const OAuthClientRegistrationOrderByWithAggregationInputSchema: z.ZodType<Prisma.OAuthClientRegistrationOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  mcpServerId: z.lazy(() => SortOrderSchema).optional(),
  authorizationServerUrl: z.lazy(() => SortOrderSchema).optional(),
  clientId: z.lazy(() => SortOrderSchema).optional(),
  clientSecret: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  registrationAccessToken: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => OAuthClientRegistrationCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => OAuthClientRegistrationMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => OAuthClientRegistrationMinOrderByAggregateInputSchema).optional(),
});

export default OAuthClientRegistrationOrderByWithAggregationInputSchema;
