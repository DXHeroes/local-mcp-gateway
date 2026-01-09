import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const ProfileMcpServerToolMinOrderByAggregateInputSchema: z.ZodType<Prisma.ProfileMcpServerToolMinOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  profileMcpServerId: z.lazy(() => SortOrderSchema).optional(),
  toolName: z.lazy(() => SortOrderSchema).optional(),
  isEnabled: z.lazy(() => SortOrderSchema).optional(),
  customName: z.lazy(() => SortOrderSchema).optional(),
  customDescription: z.lazy(() => SortOrderSchema).optional(),
  customInputSchema: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export default ProfileMcpServerToolMinOrderByAggregateInputSchema;
