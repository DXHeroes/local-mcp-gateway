import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { GatewaySettingWhereInputSchema } from './GatewaySettingWhereInputSchema';
import { StringFilterSchema } from './StringFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';

export const GatewaySettingWhereUniqueInputSchema: z.ZodType<Prisma.GatewaySettingWhereUniqueInput> = z.union([
  z.object({
    id: z.uuid(),
    key: z.string(),
  }),
  z.object({
    id: z.uuid(),
  }),
  z.object({
    key: z.string(),
  }),
])
.and(z.strictObject({
  id: z.uuid().optional(),
  key: z.string().optional(),
  AND: z.union([ z.lazy(() => GatewaySettingWhereInputSchema), z.lazy(() => GatewaySettingWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => GatewaySettingWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => GatewaySettingWhereInputSchema), z.lazy(() => GatewaySettingWhereInputSchema).array() ]).optional(),
  value: z.union([ z.lazy(() => StringFilterSchema), z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema), z.coerce.date() ]).optional(),
}));

export default GatewaySettingWhereUniqueInputSchema;
