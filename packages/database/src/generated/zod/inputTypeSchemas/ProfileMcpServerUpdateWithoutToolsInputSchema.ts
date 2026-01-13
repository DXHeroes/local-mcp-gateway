import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { StringFieldUpdateOperationsInputSchema } from './StringFieldUpdateOperationsInputSchema';
import { IntFieldUpdateOperationsInputSchema } from './IntFieldUpdateOperationsInputSchema';
import { BoolFieldUpdateOperationsInputSchema } from './BoolFieldUpdateOperationsInputSchema';
import { DateTimeFieldUpdateOperationsInputSchema } from './DateTimeFieldUpdateOperationsInputSchema';
import { ProfileUpdateOneRequiredWithoutMcpServersNestedInputSchema } from './ProfileUpdateOneRequiredWithoutMcpServersNestedInputSchema';
import { McpServerUpdateOneRequiredWithoutProfilesNestedInputSchema } from './McpServerUpdateOneRequiredWithoutProfilesNestedInputSchema';

export const ProfileMcpServerUpdateWithoutToolsInputSchema: z.ZodType<Prisma.ProfileMcpServerUpdateWithoutToolsInput> = z.strictObject({
  id: z.union([ z.uuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  order: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  profile: z.lazy(() => ProfileUpdateOneRequiredWithoutMcpServersNestedInputSchema).optional(),
  mcpServer: z.lazy(() => McpServerUpdateOneRequiredWithoutProfilesNestedInputSchema).optional(),
});

export default ProfileMcpServerUpdateWithoutToolsInputSchema;
