import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { GatewaySettingUpdateInputSchema } from '../inputTypeSchemas/GatewaySettingUpdateInputSchema'
import { GatewaySettingUncheckedUpdateInputSchema } from '../inputTypeSchemas/GatewaySettingUncheckedUpdateInputSchema'
import { GatewaySettingWhereUniqueInputSchema } from '../inputTypeSchemas/GatewaySettingWhereUniqueInputSchema'
// Select schema needs to be in file to prevent circular imports
//------------------------------------------------------

export const GatewaySettingSelectSchema: z.ZodType<Prisma.GatewaySettingSelect> = z.object({
  id: z.boolean().optional(),
  key: z.boolean().optional(),
  value: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
}).strict()

export const GatewaySettingUpdateArgsSchema: z.ZodType<Prisma.GatewaySettingUpdateArgs> = z.object({
  select: GatewaySettingSelectSchema.optional(),
  data: z.union([ GatewaySettingUpdateInputSchema, GatewaySettingUncheckedUpdateInputSchema ]),
  where: GatewaySettingWhereUniqueInputSchema, 
}).strict();

export default GatewaySettingUpdateArgsSchema;
