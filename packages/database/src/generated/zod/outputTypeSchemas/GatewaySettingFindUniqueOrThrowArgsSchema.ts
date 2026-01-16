import { z } from 'zod';
import type { Prisma } from '../../prisma';
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

export const GatewaySettingFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.GatewaySettingFindUniqueOrThrowArgs> = z.object({
  select: GatewaySettingSelectSchema.optional(),
  where: GatewaySettingWhereUniqueInputSchema, 
}).strict();

export default GatewaySettingFindUniqueOrThrowArgsSchema;
