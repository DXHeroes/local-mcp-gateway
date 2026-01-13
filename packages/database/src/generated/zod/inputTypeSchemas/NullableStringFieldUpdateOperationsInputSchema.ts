import type { Prisma } from '../../prisma';

import { z } from 'zod';

export const NullableStringFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableStringFieldUpdateOperationsInput> = z.strictObject({
  set: z.string().optional().nullable(),
});

export default NullableStringFieldUpdateOperationsInputSchema;
