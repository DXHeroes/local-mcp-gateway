import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const OAuthTokenMinOrderByAggregateInputSchema: z.ZodType<Prisma.OAuthTokenMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  mcpServerId: z.lazy(() => SortOrderSchema).optional(),
  accessToken: z.lazy(() => SortOrderSchema).optional(),
  refreshToken: z.lazy(() => SortOrderSchema).optional(),
  tokenType: z.lazy(() => SortOrderSchema).optional(),
  scope: z.lazy(() => SortOrderSchema).optional(),
  expiresAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export default OAuthTokenMinOrderByAggregateInputSchema;
