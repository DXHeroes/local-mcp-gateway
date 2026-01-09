import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { SortOrderInputSchema } from './SortOrderInputSchema';
import { ProfileMcpServerOrderByRelationAggregateInputSchema } from './ProfileMcpServerOrderByRelationAggregateInputSchema';
import { DebugLogOrderByRelationAggregateInputSchema } from './DebugLogOrderByRelationAggregateInputSchema';

export const ProfileOrderByWithRelationInputSchema: z.ZodType<Prisma.ProfileOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  description: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  mcpServers: z.lazy(() => ProfileMcpServerOrderByRelationAggregateInputSchema).optional(),
  debugLogs: z.lazy(() => DebugLogOrderByRelationAggregateInputSchema).optional(),
});

export default ProfileOrderByWithRelationInputSchema;
