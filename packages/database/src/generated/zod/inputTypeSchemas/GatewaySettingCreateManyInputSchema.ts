import type { Prisma } from '../../prisma';

import { z } from 'zod';

export const GatewaySettingCreateManyInputSchema: z.ZodType<Prisma.GatewaySettingCreateManyInput> = z.strictObject({
  id: z.uuid().optional(),
  key: z.string(),
  value: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export default GatewaySettingCreateManyInputSchema;
