import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const OAuthClientRegistrationOrderByRelationAggregateInputSchema: z.ZodType<Prisma.OAuthClientRegistrationOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export default OAuthClientRegistrationOrderByRelationAggregateInputSchema;
