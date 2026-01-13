import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { StringFieldUpdateOperationsInputSchema } from './StringFieldUpdateOperationsInputSchema';
import { NullableStringFieldUpdateOperationsInputSchema } from './NullableStringFieldUpdateOperationsInputSchema';
import { DateTimeFieldUpdateOperationsInputSchema } from './DateTimeFieldUpdateOperationsInputSchema';
import { DebugLogUncheckedUpdateManyWithoutProfileNestedInputSchema } from './DebugLogUncheckedUpdateManyWithoutProfileNestedInputSchema';

export const ProfileUncheckedUpdateWithoutMcpServersInputSchema: z.ZodType<Prisma.ProfileUncheckedUpdateWithoutMcpServersInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  debugLogs: z.lazy(() => DebugLogUncheckedUpdateManyWithoutProfileNestedInputSchema).optional(),
});

export default ProfileUncheckedUpdateWithoutMcpServersInputSchema;
