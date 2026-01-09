import type { Prisma } from '../../prisma';

import { z } from 'zod';

export const NestedBoolFilterSchema: z.ZodType<Prisma.NestedBoolFilter> = z.strictObject({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolFilterSchema) ]).optional(),
});

export default NestedBoolFilterSchema;
