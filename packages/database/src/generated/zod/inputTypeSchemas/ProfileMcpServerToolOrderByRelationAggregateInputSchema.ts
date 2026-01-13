import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const ProfileMcpServerToolOrderByRelationAggregateInputSchema: z.ZodType<Prisma.ProfileMcpServerToolOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export default ProfileMcpServerToolOrderByRelationAggregateInputSchema;
