import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const ProfileMcpServerSumOrderByAggregateInputSchema: z.ZodType<Prisma.ProfileMcpServerSumOrderByAggregateInput> = z.strictObject({
  order: z.lazy(() => SortOrderSchema).optional(),
});

export default ProfileMcpServerSumOrderByAggregateInputSchema;
