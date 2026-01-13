import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { DebugLogCreateManyInputSchema } from '../inputTypeSchemas/DebugLogCreateManyInputSchema'

export const DebugLogCreateManyAndReturnArgsSchema: z.ZodType<Prisma.DebugLogCreateManyAndReturnArgs> = z.object({
  data: z.union([ DebugLogCreateManyInputSchema, DebugLogCreateManyInputSchema.array() ]),
}).strict();

export default DebugLogCreateManyAndReturnArgsSchema;
