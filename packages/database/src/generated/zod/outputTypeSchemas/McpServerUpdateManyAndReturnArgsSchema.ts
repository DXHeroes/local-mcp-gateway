import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { McpServerUpdateManyMutationInputSchema } from '../inputTypeSchemas/McpServerUpdateManyMutationInputSchema'
import { McpServerUncheckedUpdateManyInputSchema } from '../inputTypeSchemas/McpServerUncheckedUpdateManyInputSchema'
import { McpServerWhereInputSchema } from '../inputTypeSchemas/McpServerWhereInputSchema'

export const McpServerUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.McpServerUpdateManyAndReturnArgs> = z.object({
  data: z.union([ McpServerUpdateManyMutationInputSchema, McpServerUncheckedUpdateManyInputSchema ]),
  where: McpServerWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export default McpServerUpdateManyAndReturnArgsSchema;
