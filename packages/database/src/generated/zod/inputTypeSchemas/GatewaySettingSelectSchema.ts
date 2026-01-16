import { z } from 'zod';
import type { Prisma } from '../../prisma';

export const GatewaySettingSelectSchema: z.ZodType<Prisma.GatewaySettingSelect> = z.object({
  id: z.boolean().optional(),
  key: z.boolean().optional(),
  value: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
}).strict()

export default GatewaySettingSelectSchema;
