import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { GatewaySettingCreateManyInputSchema } from '../inputTypeSchemas/GatewaySettingCreateManyInputSchema'

export const GatewaySettingCreateManyAndReturnArgsSchema: z.ZodType<Prisma.GatewaySettingCreateManyAndReturnArgs> = z.object({
  data: z.union([ GatewaySettingCreateManyInputSchema, GatewaySettingCreateManyInputSchema.array() ]),
}).strict();

export default GatewaySettingCreateManyAndReturnArgsSchema;
