import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { StringWithAggregatesFilterSchema } from './StringWithAggregatesFilterSchema';
import { DateTimeWithAggregatesFilterSchema } from './DateTimeWithAggregatesFilterSchema';

export const GatewaySettingScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.GatewaySettingScalarWhereWithAggregatesInput> = z.strictObject({
  AND: z.union([ z.lazy(() => GatewaySettingScalarWhereWithAggregatesInputSchema), z.lazy(() => GatewaySettingScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => GatewaySettingScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => GatewaySettingScalarWhereWithAggregatesInputSchema), z.lazy(() => GatewaySettingScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  key: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  value: z.union([ z.lazy(() => StringWithAggregatesFilterSchema), z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema), z.coerce.date() ]).optional(),
});

export default GatewaySettingScalarWhereWithAggregatesInputSchema;
