import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { GatewaySettingWhereInputSchema } from '../inputTypeSchemas/GatewaySettingWhereInputSchema'
import { GatewaySettingOrderByWithAggregationInputSchema } from '../inputTypeSchemas/GatewaySettingOrderByWithAggregationInputSchema'
import { GatewaySettingScalarFieldEnumSchema } from '../inputTypeSchemas/GatewaySettingScalarFieldEnumSchema'
import { GatewaySettingScalarWhereWithAggregatesInputSchema } from '../inputTypeSchemas/GatewaySettingScalarWhereWithAggregatesInputSchema'

export const GatewaySettingGroupByArgsSchema: z.ZodType<Prisma.GatewaySettingGroupByArgs> = z.object({
  where: GatewaySettingWhereInputSchema.optional(), 
  orderBy: z.union([ GatewaySettingOrderByWithAggregationInputSchema.array(), GatewaySettingOrderByWithAggregationInputSchema ]).optional(),
  by: GatewaySettingScalarFieldEnumSchema.array(), 
  having: GatewaySettingScalarWhereWithAggregatesInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict();

export default GatewaySettingGroupByArgsSchema;
