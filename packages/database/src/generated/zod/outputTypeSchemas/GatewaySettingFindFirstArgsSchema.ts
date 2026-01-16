import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { GatewaySettingWhereInputSchema } from '../inputTypeSchemas/GatewaySettingWhereInputSchema'
import { GatewaySettingOrderByWithRelationInputSchema } from '../inputTypeSchemas/GatewaySettingOrderByWithRelationInputSchema'
import { GatewaySettingWhereUniqueInputSchema } from '../inputTypeSchemas/GatewaySettingWhereUniqueInputSchema'
import { GatewaySettingScalarFieldEnumSchema } from '../inputTypeSchemas/GatewaySettingScalarFieldEnumSchema'
// Select schema needs to be in file to prevent circular imports
//------------------------------------------------------

export const GatewaySettingSelectSchema: z.ZodType<Prisma.GatewaySettingSelect> = z.object({
  id: z.boolean().optional(),
  key: z.boolean().optional(),
  value: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
}).strict()

export const GatewaySettingFindFirstArgsSchema: z.ZodType<Prisma.GatewaySettingFindFirstArgs> = z.object({
  select: GatewaySettingSelectSchema.optional(),
  where: GatewaySettingWhereInputSchema.optional(), 
  orderBy: z.union([ GatewaySettingOrderByWithRelationInputSchema.array(), GatewaySettingOrderByWithRelationInputSchema ]).optional(),
  cursor: GatewaySettingWhereUniqueInputSchema.optional(), 
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ GatewaySettingScalarFieldEnumSchema, GatewaySettingScalarFieldEnumSchema.array() ]).optional(),
}).strict();

export default GatewaySettingFindFirstArgsSchema;
