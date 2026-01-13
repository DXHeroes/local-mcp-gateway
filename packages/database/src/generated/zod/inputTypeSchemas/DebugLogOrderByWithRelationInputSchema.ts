import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { SortOrderInputSchema } from './SortOrderInputSchema';
import { ProfileOrderByWithRelationInputSchema } from './ProfileOrderByWithRelationInputSchema';
import { McpServerOrderByWithRelationInputSchema } from './McpServerOrderByWithRelationInputSchema';

export const DebugLogOrderByWithRelationInputSchema: z.ZodType<Prisma.DebugLogOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  profileId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  mcpServerId: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  requestType: z.lazy(() => SortOrderSchema).optional(),
  requestPayload: z.lazy(() => SortOrderSchema).optional(),
  responsePayload: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  errorMessage: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  durationMs: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  profile: z.lazy(() => ProfileOrderByWithRelationInputSchema).optional(),
  mcpServer: z.lazy(() => McpServerOrderByWithRelationInputSchema).optional(),
});

export default DebugLogOrderByWithRelationInputSchema;
