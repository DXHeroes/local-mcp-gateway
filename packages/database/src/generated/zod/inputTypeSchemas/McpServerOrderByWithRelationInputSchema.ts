import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { SortOrderInputSchema } from './SortOrderInputSchema';
import { UserOrderByWithRelationInputSchema } from './UserOrderByWithRelationInputSchema';
import { ProfileMcpServerOrderByRelationAggregateInputSchema } from './ProfileMcpServerOrderByRelationAggregateInputSchema';
import { OAuthTokenOrderByWithRelationInputSchema } from './OAuthTokenOrderByWithRelationInputSchema';
import { OAuthClientRegistrationOrderByRelationAggregateInputSchema } from './OAuthClientRegistrationOrderByRelationAggregateInputSchema';
import { McpServerToolsCacheOrderByRelationAggregateInputSchema } from './McpServerToolsCacheOrderByRelationAggregateInputSchema';
import { McpServerToolConfigOrderByRelationAggregateInputSchema } from './McpServerToolConfigOrderByRelationAggregateInputSchema';
import { DebugLogOrderByRelationAggregateInputSchema } from './DebugLogOrderByRelationAggregateInputSchema';

export const McpServerOrderByWithRelationInputSchema: z.ZodType<Prisma.McpServerOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  config: z.lazy(() => SortOrderSchema).optional(),
  oauthConfig: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  apiKeyConfig: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  presetId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  user: z.lazy(() => UserOrderByWithRelationInputSchema).optional(),
  profiles: z.lazy(() => ProfileMcpServerOrderByRelationAggregateInputSchema).optional(),
  oauthToken: z.lazy(() => OAuthTokenOrderByWithRelationInputSchema).optional(),
  oauthClientRegistrations: z.lazy(() => OAuthClientRegistrationOrderByRelationAggregateInputSchema).optional(),
  toolsCache: z.lazy(() => McpServerToolsCacheOrderByRelationAggregateInputSchema).optional(),
  toolConfigs: z.lazy(() => McpServerToolConfigOrderByRelationAggregateInputSchema).optional(),
  debugLogs: z.lazy(() => DebugLogOrderByRelationAggregateInputSchema).optional(),
});

export default McpServerOrderByWithRelationInputSchema;
