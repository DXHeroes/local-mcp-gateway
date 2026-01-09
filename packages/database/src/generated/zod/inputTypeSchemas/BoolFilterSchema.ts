import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { NestedBoolFilterSchema } from './NestedBoolFilterSchema';

export const BoolFilterSchema: z.ZodType<Prisma.BoolFilter> = z.strictObject({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolFilterSchema) ]).optional(),
});

export default BoolFilterSchema;
