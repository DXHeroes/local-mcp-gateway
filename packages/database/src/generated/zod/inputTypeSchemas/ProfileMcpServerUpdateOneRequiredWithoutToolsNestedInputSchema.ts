import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileMcpServerCreateWithoutToolsInputSchema } from './ProfileMcpServerCreateWithoutToolsInputSchema';
import { ProfileMcpServerUncheckedCreateWithoutToolsInputSchema } from './ProfileMcpServerUncheckedCreateWithoutToolsInputSchema';
import { ProfileMcpServerCreateOrConnectWithoutToolsInputSchema } from './ProfileMcpServerCreateOrConnectWithoutToolsInputSchema';
import { ProfileMcpServerUpsertWithoutToolsInputSchema } from './ProfileMcpServerUpsertWithoutToolsInputSchema';
import { ProfileMcpServerWhereUniqueInputSchema } from './ProfileMcpServerWhereUniqueInputSchema';
import { ProfileMcpServerUpdateToOneWithWhereWithoutToolsInputSchema } from './ProfileMcpServerUpdateToOneWithWhereWithoutToolsInputSchema';
import { ProfileMcpServerUpdateWithoutToolsInputSchema } from './ProfileMcpServerUpdateWithoutToolsInputSchema';
import { ProfileMcpServerUncheckedUpdateWithoutToolsInputSchema } from './ProfileMcpServerUncheckedUpdateWithoutToolsInputSchema';

export const ProfileMcpServerUpdateOneRequiredWithoutToolsNestedInputSchema: z.ZodType<Prisma.ProfileMcpServerUpdateOneRequiredWithoutToolsNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => ProfileMcpServerCreateWithoutToolsInputSchema), z.lazy(() => ProfileMcpServerUncheckedCreateWithoutToolsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => ProfileMcpServerCreateOrConnectWithoutToolsInputSchema).optional(),
  upsert: z.lazy(() => ProfileMcpServerUpsertWithoutToolsInputSchema).optional(),
  connect: z.lazy(() => ProfileMcpServerWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => ProfileMcpServerUpdateToOneWithWhereWithoutToolsInputSchema), z.lazy(() => ProfileMcpServerUpdateWithoutToolsInputSchema), z.lazy(() => ProfileMcpServerUncheckedUpdateWithoutToolsInputSchema) ]).optional(),
});

export default ProfileMcpServerUpdateOneRequiredWithoutToolsNestedInputSchema;
