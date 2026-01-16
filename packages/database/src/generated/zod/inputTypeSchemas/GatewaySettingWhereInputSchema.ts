import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { StringFilterSchema } from './StringFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';

export const GatewaySettingWhereInputSchema: z.ZodType<Prisma.GatewaySettingWhereInput> = z.strictObject({
  AND: z.union([ z.lazy(() => GatewaySettingWhereInputSchema), z.lazy(() => GatewaySettingWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => GatewaySettingWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => GatewaySettingWhereInputSchema), z.lazy(() => GatewaySettingWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  key: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  value: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
});

export default GatewaySettingWhereInputSchema;
