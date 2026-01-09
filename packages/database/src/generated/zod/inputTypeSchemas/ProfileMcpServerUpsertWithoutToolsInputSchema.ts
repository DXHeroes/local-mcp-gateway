import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileMcpServerUpdateWithoutToolsInputSchema } from './ProfileMcpServerUpdateWithoutToolsInputSchema';
import { ProfileMcpServerUncheckedUpdateWithoutToolsInputSchema } from './ProfileMcpServerUncheckedUpdateWithoutToolsInputSchema';
import { ProfileMcpServerCreateWithoutToolsInputSchema } from './ProfileMcpServerCreateWithoutToolsInputSchema';
import { ProfileMcpServerUncheckedCreateWithoutToolsInputSchema } from './ProfileMcpServerUncheckedCreateWithoutToolsInputSchema';
import { ProfileMcpServerWhereInputSchema } from './ProfileMcpServerWhereInputSchema';

export const ProfileMcpServerUpsertWithoutToolsInputSchema: z.ZodType<Prisma.ProfileMcpServerUpsertWithoutToolsInput> = z.strictObject({
  update: z.union([ z.lazy(() => ProfileMcpServerUpdateWithoutToolsInputSchema), z.lazy(() => ProfileMcpServerUncheckedUpdateWithoutToolsInputSchema) ]),
  create: z.union([ z.lazy(() => ProfileMcpServerCreateWithoutToolsInputSchema), z.lazy(() => ProfileMcpServerUncheckedCreateWithoutToolsInputSchema) ]),
  where: z.lazy(() => ProfileMcpServerWhereInputSchema).optional(),
});

export default ProfileMcpServerUpsertWithoutToolsInputSchema;
