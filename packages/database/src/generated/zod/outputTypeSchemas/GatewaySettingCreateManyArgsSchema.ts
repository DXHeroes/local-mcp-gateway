import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { GatewaySettingCreateManyInputSchema } from '../inputTypeSchemas/GatewaySettingCreateManyInputSchema'

export const GatewaySettingCreateManyArgsSchema: z.ZodType<Prisma.GatewaySettingCreateManyArgs> = z.object({
  data: z.union([ GatewaySettingCreateManyInputSchema, GatewaySettingCreateManyInputSchema.array() ]),
}).strict();

export default GatewaySettingCreateManyArgsSchema;
