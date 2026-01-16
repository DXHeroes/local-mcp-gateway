import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { GatewaySettingWhereInputSchema } from '../inputTypeSchemas/GatewaySettingWhereInputSchema'
import { GatewaySettingOrderByWithRelationInputSchema } from '../inputTypeSchemas/GatewaySettingOrderByWithRelationInputSchema'
import { GatewaySettingWhereUniqueInputSchema } from '../inputTypeSchemas/GatewaySettingWhereUniqueInputSchema'

export const GatewaySettingAggregateArgsSchema: z.ZodType<Prisma.GatewaySettingAggregateArgs> = z.object({
  where: GatewaySettingWhereInputSchema.optional(), 
  orderBy: z.union([ GatewaySettingOrderByWithRelationInputSchema.array(), GatewaySettingOrderByWithRelationInputSchema ]).optional(),
  cursor: GatewaySettingWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export default GatewaySettingAggregateArgsSchema;
