import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { ProfileMcpServerCountOrderByAggregateInputSchema } from './ProfileMcpServerCountOrderByAggregateInputSchema';
import { ProfileMcpServerAvgOrderByAggregateInputSchema } from './ProfileMcpServerAvgOrderByAggregateInputSchema';
import { ProfileMcpServerMaxOrderByAggregateInputSchema } from './ProfileMcpServerMaxOrderByAggregateInputSchema';
import { ProfileMcpServerMinOrderByAggregateInputSchema } from './ProfileMcpServerMinOrderByAggregateInputSchema';
import { ProfileMcpServerSumOrderByAggregateInputSchema } from './ProfileMcpServerSumOrderByAggregateInputSchema';

export const ProfileMcpServerOrderByWithAggregationInputSchema: z.ZodType<Prisma.ProfileMcpServerOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  profileId: z.lazy(() => SortOrderSchema).optional(),
  mcpServerId: z.lazy(() => SortOrderSchema).optional(),
  order: z.lazy(() => SortOrderSchema).optional(),
  isActive: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => ProfileMcpServerCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => ProfileMcpServerAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => ProfileMcpServerMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => ProfileMcpServerMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => ProfileMcpServerSumOrderByAggregateInputSchema).optional(),
});

export default ProfileMcpServerOrderByWithAggregationInputSchema;
