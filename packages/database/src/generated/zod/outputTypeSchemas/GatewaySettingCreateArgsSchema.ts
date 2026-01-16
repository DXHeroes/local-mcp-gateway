import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { GatewaySettingCreateInputSchema } from '../inputTypeSchemas/GatewaySettingCreateInputSchema'
import { GatewaySettingUncheckedCreateInputSchema } from '../inputTypeSchemas/GatewaySettingUncheckedCreateInputSchema'
// Select schema needs to be in file to prevent circular imports
//------------------------------------------------------

export const GatewaySettingSelectSchema: z.ZodType<Prisma.GatewaySettingSelect> = z.object({
  id: z.boolean().optional(),
  key: z.boolean().optional(),
  value: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
}).strict()

export const GatewaySettingCreateArgsSchema: z.ZodType<Prisma.GatewaySettingCreateArgs> = z.object({
  select: GatewaySettingSelectSchema.optional(),
  data: z.union([ GatewaySettingCreateInputSchema, GatewaySettingUncheckedCreateInputSchema ]),
}).strict();

export default GatewaySettingCreateArgsSchema;
