import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileMcpServerWhereUniqueInputSchema } from './ProfileMcpServerWhereUniqueInputSchema';
import { ProfileMcpServerCreateWithoutToolsInputSchema } from './ProfileMcpServerCreateWithoutToolsInputSchema';
import { ProfileMcpServerUncheckedCreateWithoutToolsInputSchema } from './ProfileMcpServerUncheckedCreateWithoutToolsInputSchema';

export const ProfileMcpServerCreateOrConnectWithoutToolsInputSchema: z.ZodType<Prisma.ProfileMcpServerCreateOrConnectWithoutToolsInput> = z.strictObject({
  where: z.lazy(() => ProfileMcpServerWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => ProfileMcpServerCreateWithoutToolsInputSchema), z.lazy(() => ProfileMcpServerUncheckedCreateWithoutToolsInputSchema) ]),
});

export default ProfileMcpServerCreateOrConnectWithoutToolsInputSchema;
