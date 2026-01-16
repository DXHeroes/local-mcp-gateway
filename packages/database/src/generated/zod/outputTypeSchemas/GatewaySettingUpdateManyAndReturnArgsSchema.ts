import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { GatewaySettingUpdateManyMutationInputSchema } from '../inputTypeSchemas/GatewaySettingUpdateManyMutationInputSchema'
import { GatewaySettingUncheckedUpdateManyInputSchema } from '../inputTypeSchemas/GatewaySettingUncheckedUpdateManyInputSchema'
import { GatewaySettingWhereInputSchema } from '../inputTypeSchemas/GatewaySettingWhereInputSchema'

export const GatewaySettingUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.GatewaySettingUpdateManyAndReturnArgs> = z.object({
  data: z.union([ GatewaySettingUpdateManyMutationInputSchema, GatewaySettingUncheckedUpdateManyInputSchema ]),
  where: GatewaySettingWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export default GatewaySettingUpdateManyAndReturnArgsSchema;
