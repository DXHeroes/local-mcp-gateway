import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const OAuthClientRegistrationMaxOrderByAggregateInputSchema: z.ZodType<Prisma.OAuthClientRegistrationMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  mcpServerId: z.lazy(() => SortOrderSchema).optional(),
  authorizationServerUrl: z.lazy(() => SortOrderSchema).optional(),
  clientId: z.lazy(() => SortOrderSchema).optional(),
  clientSecret: z.lazy(() => SortOrderSchema).optional(),
  registrationAccessToken: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export default OAuthClientRegistrationMaxOrderByAggregateInputSchema;
