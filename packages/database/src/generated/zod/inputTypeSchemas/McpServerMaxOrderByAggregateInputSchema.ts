import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';

export const McpServerMaxOrderByAggregateInputSchema: z.ZodType<Prisma.McpServerMaxOrderByAggregateInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  type: z.lazy(() => SortOrderSchema).optional(),
  config: z.lazy(() => SortOrderSchema).optional(),
  oauthConfig: z.lazy(() => SortOrderSchema).optional(),
  apiKeyConfig: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
});

export default McpServerMaxOrderByAggregateInputSchema;
