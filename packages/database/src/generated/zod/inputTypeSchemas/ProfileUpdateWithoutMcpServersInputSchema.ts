import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { StringFieldUpdateOperationsInputSchema } from './StringFieldUpdateOperationsInputSchema';
import { NullableStringFieldUpdateOperationsInputSchema } from './NullableStringFieldUpdateOperationsInputSchema';
import { DateTimeFieldUpdateOperationsInputSchema } from './DateTimeFieldUpdateOperationsInputSchema';
import { UserUpdateOneRequiredWithoutProfilesNestedInputSchema } from './UserUpdateOneRequiredWithoutProfilesNestedInputSchema';
import { OrganizationUpdateOneRequiredWithoutProfilesNestedInputSchema } from './OrganizationUpdateOneRequiredWithoutProfilesNestedInputSchema';
import { DebugLogUpdateManyWithoutProfileNestedInputSchema } from './DebugLogUpdateManyWithoutProfileNestedInputSchema';

export const ProfileUpdateWithoutMcpServersInputSchema: z.ZodType<Prisma.ProfileUpdateWithoutMcpServersInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutProfilesNestedInputSchema).optional(),
  organization: z.lazy(() => OrganizationUpdateOneRequiredWithoutProfilesNestedInputSchema).optional(),
  debugLogs: z.lazy(() => DebugLogUpdateManyWithoutProfileNestedInputSchema).optional(),
});

export default ProfileUpdateWithoutMcpServersInputSchema;
