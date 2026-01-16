import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { GatewaySettingWhereInputSchema } from '../inputTypeSchemas/GatewaySettingWhereInputSchema'

export const GatewaySettingDeleteManyArgsSchema: z.ZodType<Prisma.GatewaySettingDeleteManyArgs> = z.object({
  where: GatewaySettingWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export default GatewaySettingDeleteManyArgsSchema;
