import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const McpServerToolsCacheOrderByRelationAggregateInputSchema: z.ZodType<Prisma.McpServerToolsCacheOrderByRelationAggregateInput> = z.strictObject({
  _count: z.lazy(() => SortOrderSchema).optional(),
});

export default McpServerToolsCacheOrderByRelationAggregateInputSchema;
