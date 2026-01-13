import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { DebugLogWhereInputSchema } from '../inputTypeSchemas/DebugLogWhereInputSchema'

export const DebugLogDeleteManyArgsSchema: z.ZodType<Prisma.DebugLogDeleteManyArgs> = z.object({
  where: DebugLogWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export default DebugLogDeleteManyArgsSchema;
