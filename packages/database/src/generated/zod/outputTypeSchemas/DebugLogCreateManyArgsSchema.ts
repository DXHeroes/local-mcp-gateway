import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { DebugLogCreateManyInputSchema } from '../inputTypeSchemas/DebugLogCreateManyInputSchema'

export const DebugLogCreateManyArgsSchema: z.ZodType<Prisma.DebugLogCreateManyArgs> = z.object({
  data: z.union([ DebugLogCreateManyInputSchema, DebugLogCreateManyInputSchema.array() ]),
}).strict();

export default DebugLogCreateManyArgsSchema;
