import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { StringFieldUpdateOperationsInputSchema } from './StringFieldUpdateOperationsInputSchema';
import { NullableStringFieldUpdateOperationsInputSchema } from './NullableStringFieldUpdateOperationsInputSchema';
import { NullableIntFieldUpdateOperationsInputSchema } from './NullableIntFieldUpdateOperationsInputSchema';
import { DateTimeFieldUpdateOperationsInputSchema } from './DateTimeFieldUpdateOperationsInputSchema';

export const DebugLogUncheckedUpdateManyWithoutMcpServerInputSchema: z.ZodType<Prisma.DebugLogUncheckedUpdateManyWithoutMcpServerInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  profileId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  requestType: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  requestPayload: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  responsePayload: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  errorMessage: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  durationMs: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
});

export default DebugLogUncheckedUpdateManyWithoutMcpServerInputSchema;
