import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { SortOrderInputSchema } from './SortOrderInputSchema';
import { McpServerOrderByWithRelationInputSchema } from './McpServerOrderByWithRelationInputSchema';

export const OAuthTokenOrderByWithRelationInputSchema: z.ZodType<Prisma.OAuthTokenOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  mcpServerId: z.lazy(() => SortOrderSchema).optional(),
  accessToken: z.lazy(() => SortOrderSchema).optional(),
  refreshToken: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  tokenType: z.lazy(() => SortOrderSchema).optional(),
  scope: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  expiresAt: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  mcpServer: z.lazy(() => McpServerOrderByWithRelationInputSchema).optional(),
});

export default OAuthTokenOrderByWithRelationInputSchema;
