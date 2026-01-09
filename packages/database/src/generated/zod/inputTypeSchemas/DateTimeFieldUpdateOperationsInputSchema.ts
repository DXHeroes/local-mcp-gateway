import type { Prisma } from '../../prisma';

import { z } from 'zod';

export const DateTimeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.DateTimeFieldUpdateOperationsInput> = z.strictObject({
  set: z.coerce.date().optional(),
});

export default DateTimeFieldUpdateOperationsInputSchema;
