import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { SortOrderInputSchema } from './SortOrderInputSchema';
import { ProfileMcpServerToolCountOrderByAggregateInputSchema } from './ProfileMcpServerToolCountOrderByAggregateInputSchema';
import { ProfileMcpServerToolMaxOrderByAggregateInputSchema } from './ProfileMcpServerToolMaxOrderByAggregateInputSchema';
import { ProfileMcpServerToolMinOrderByAggregateInputSchema } from './ProfileMcpServerToolMinOrderByAggregateInputSchema';

export const ProfileMcpServerToolOrderByWithAggregationInputSchema: z.ZodType<Prisma.ProfileMcpServerToolOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  profileMcpServerId: z.lazy(() => SortOrderSchema).optional(),
  toolName: z.lazy(() => SortOrderSchema).optional(),
  isEnabled: z.lazy(() => SortOrderSchema).optional(),
  customName: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  customDescription: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  customInputSchema: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => ProfileMcpServerToolCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => ProfileMcpServerToolMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => ProfileMcpServerToolMinOrderByAggregateInputSchema).optional(),
});

export default ProfileMcpServerToolOrderByWithAggregationInputSchema;
