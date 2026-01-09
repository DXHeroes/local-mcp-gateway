import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { StringFieldUpdateOperationsInputSchema } from './StringFieldUpdateOperationsInputSchema';
import { IntFieldUpdateOperationsInputSchema } from './IntFieldUpdateOperationsInputSchema';
import { BoolFieldUpdateOperationsInputSchema } from './BoolFieldUpdateOperationsInputSchema';
import { DateTimeFieldUpdateOperationsInputSchema } from './DateTimeFieldUpdateOperationsInputSchema';
import { McpServerUpdateOneRequiredWithoutProfilesNestedInputSchema } from './McpServerUpdateOneRequiredWithoutProfilesNestedInputSchema';
import { ProfileMcpServerToolUpdateManyWithoutProfileMcpServerNestedInputSchema } from './ProfileMcpServerToolUpdateManyWithoutProfileMcpServerNestedInputSchema';

export const ProfileMcpServerUpdateWithoutProfileInputSchema: z.ZodType<Prisma.ProfileMcpServerUpdateWithoutProfileInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  mcpServer: z.lazy(() => McpServerUpdateOneRequiredWithoutProfilesNestedInputSchema).optional(),
  tools: z.lazy(() => ProfileMcpServerToolUpdateManyWithoutProfileMcpServerNestedInputSchema).optional(),
});

export default ProfileMcpServerUpdateWithoutProfileInputSchema;
