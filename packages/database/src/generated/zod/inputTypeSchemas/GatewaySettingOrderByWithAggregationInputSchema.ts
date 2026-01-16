import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { GatewaySettingCountOrderByAggregateInputSchema } from './GatewaySettingCountOrderByAggregateInputSchema';
import { GatewaySettingMaxOrderByAggregateInputSchema } from './GatewaySettingMaxOrderByAggregateInputSchema';
import { GatewaySettingMinOrderByAggregateInputSchema } from './GatewaySettingMinOrderByAggregateInputSchema';

export const GatewaySettingOrderByWithAggregationInputSchema: z.ZodType<Prisma.GatewaySettingOrderByWithAggregationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  key: z.lazy(() => SortOrderSchema).optional(),
  value: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => GatewaySettingCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => GatewaySettingMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => GatewaySettingMinOrderByAggregateInputSchema).optional(),
});

export default GatewaySettingOrderByWithAggregationInputSchema;
