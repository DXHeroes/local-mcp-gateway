import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { DebugLogUpdateManyMutationInputSchema } from '../inputTypeSchemas/DebugLogUpdateManyMutationInputSchema'
import { DebugLogUncheckedUpdateManyInputSchema } from '../inputTypeSchemas/DebugLogUncheckedUpdateManyInputSchema'
import { DebugLogWhereInputSchema } from '../inputTypeSchemas/DebugLogWhereInputSchema'

export const DebugLogUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.DebugLogUpdateManyAndReturnArgs> = z.object({
  data: z.union([ DebugLogUpdateManyMutationInputSchema, DebugLogUncheckedUpdateManyInputSchema ]),
  where: DebugLogWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export default DebugLogUpdateManyAndReturnArgsSchema;
