import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { SortOrderInputSchema } from './SortOrderInputSchema';
import { McpServerOrderByWithRelationInputSchema } from './McpServerOrderByWithRelationInputSchema';

export const OAuthClientRegistrationOrderByWithRelationInputSchema: z.ZodType<Prisma.OAuthClientRegistrationOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  mcpServerId: z.lazy(() => SortOrderSchema).optional(),
  authorizationServerUrl: z.lazy(() => SortOrderSchema).optional(),
  clientId: z.lazy(() => SortOrderSchema).optional(),
  clientSecret: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  registrationAccessToken: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  mcpServer: z.lazy(() => McpServerOrderByWithRelationInputSchema).optional(),
});

export default OAuthClientRegistrationOrderByWithRelationInputSchema;
