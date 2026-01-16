import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { GatewaySettingUpdateManyMutationInputSchema } from '../inputTypeSchemas/GatewaySettingUpdateManyMutationInputSchema'
import { GatewaySettingUncheckedUpdateManyInputSchema } from '../inputTypeSchemas/GatewaySettingUncheckedUpdateManyInputSchema'
import { GatewaySettingWhereInputSchema } from '../inputTypeSchemas/GatewaySettingWhereInputSchema'

export const GatewaySettingUpdateManyArgsSchema: z.ZodType<Prisma.GatewaySettingUpdateManyArgs> = z.object({
  data: z.union([ GatewaySettingUpdateManyMutationInputSchema, GatewaySettingUncheckedUpdateManyInputSchema ]),
  where: GatewaySettingWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export default GatewaySettingUpdateManyArgsSchema;
