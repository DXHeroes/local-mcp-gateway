import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const ProfileMcpServerAvgOrderByAggregateInputSchema: z.ZodType<Prisma.ProfileMcpServerAvgOrderByAggregateInput> = z.strictObject({
  order: z.lazy(() => SortOrderSchema).optional(),
});

export default ProfileMcpServerAvgOrderByAggregateInputSchema;
