import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileMcpServerCreateWithoutToolsInputSchema } from './ProfileMcpServerCreateWithoutToolsInputSchema';
import { ProfileMcpServerUncheckedCreateWithoutToolsInputSchema } from './ProfileMcpServerUncheckedCreateWithoutToolsInputSchema';
import { ProfileMcpServerCreateOrConnectWithoutToolsInputSchema } from './ProfileMcpServerCreateOrConnectWithoutToolsInputSchema';
import { ProfileMcpServerWhereUniqueInputSchema } from './ProfileMcpServerWhereUniqueInputSchema';

export const ProfileMcpServerCreateNestedOneWithoutToolsInputSchema: z.ZodType<Prisma.ProfileMcpServerCreateNestedOneWithoutToolsInput> = z.strictObject({
  create: z.union([ z.lazy(() => ProfileMcpServerCreateWithoutToolsInputSchema), z.lazy(() => ProfileMcpServerUncheckedCreateWithoutToolsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => ProfileMcpServerCreateOrConnectWithoutToolsInputSchema).optional(),
  connect: z.lazy(() => ProfileMcpServerWhereUniqueInputSchema).optional(),
});

export default ProfileMcpServerCreateNestedOneWithoutToolsInputSchema;
