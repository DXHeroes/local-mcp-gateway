import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { NestedStringNullableWithAggregatesFilterSchema } from './NestedStringNullableWithAggregatesFilterSchema';
import { NestedIntNullableFilterSchema } from './NestedIntNullableFilterSchema';
import { NestedStringNullableFilterSchema } from './NestedStringNullableFilterSchema';

export const StringNullableWithAggregatesFilterSchema: z.ZodType<Prisma.StringNullableWithAggregatesFilter> = z.strictObject({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedStringNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedStringNullableFilterSchema).optional(),
});

export default StringNullableWithAggregatesFilterSchema;
