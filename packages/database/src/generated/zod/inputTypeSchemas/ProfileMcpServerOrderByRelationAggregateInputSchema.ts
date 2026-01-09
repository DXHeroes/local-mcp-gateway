import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const ProfileMcpServerOrderByRelationAggregateInputSchema: z.ZodType<Prisma.ProfileMcpServerOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export default ProfileMcpServerOrderByRelationAggregateInputSchema;
