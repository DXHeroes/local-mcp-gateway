import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { GatewaySettingWhereUniqueInputSchema } from '../inputTypeSchemas/GatewaySettingWhereUniqueInputSchema'
import { GatewaySettingCreateInputSchema } from '../inputTypeSchemas/GatewaySettingCreateInputSchema'
import { GatewaySettingUncheckedCreateInputSchema } from '../inputTypeSchemas/GatewaySettingUncheckedCreateInputSchema'
import { GatewaySettingUpdateInputSchema } from '../inputTypeSchemas/GatewaySettingUpdateInputSchema'
import { GatewaySettingUncheckedUpdateInputSchema } from '../inputTypeSchemas/GatewaySettingUncheckedUpdateInputSchema'
// Select schema needs to be in file to prevent circular imports
//------------------------------------------------------

export const GatewaySettingSelectSchema: z.ZodType<Prisma.GatewaySettingSelect> = z.object({
  id: z.boolean().optional(),
  key: z.boolean().optional(),
  value: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
}).strict()

export const GatewaySettingUpsertArgsSchema: z.ZodType<Prisma.GatewaySettingUpsertArgs> = z.object({
  select: GatewaySettingSelectSchema.optional(),
  where: GatewaySettingWhereUniqueInputSchema, 
  create: z.union([ GatewaySettingCreateInputSchema, GatewaySettingUncheckedCreateInputSchema ]),
  update: z.union([ GatewaySettingUpdateInputSchema, GatewaySettingUncheckedUpdateInputSchema ]),
}).strict();

export default GatewaySettingUpsertArgsSchema;
