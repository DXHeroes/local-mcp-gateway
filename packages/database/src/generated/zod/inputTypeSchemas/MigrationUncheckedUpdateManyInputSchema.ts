import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { StringFieldUpdateOperationsInputSchema } from './StringFieldUpdateOperationsInputSchema';
import { DateTimeFieldUpdateOperationsInputSchema } from './DateTimeFieldUpdateOperationsInputSchema';

export const MigrationUncheckedUpdateManyInputSchema: z.ZodType<Prisma.MigrationUncheckedUpdateManyInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  executedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export default MigrationUncheckedUpdateManyInputSchema;
