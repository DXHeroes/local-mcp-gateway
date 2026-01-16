import type { Prisma } from '../../prisma';

import { z } from 'zod';

export const GatewaySettingUncheckedCreateInputSchema: z.ZodType<Prisma.GatewaySettingUncheckedCreateInput> = z.strictObject({
  id: z.uuid().optional(),
  key: z.string(),
  value: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export default GatewaySettingUncheckedCreateInputSchema;
