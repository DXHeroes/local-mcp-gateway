import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileMcpServerCreateWithoutMcpServerInputSchema } from './ProfileMcpServerCreateWithoutMcpServerInputSchema';
import { ProfileMcpServerUncheckedCreateWithoutMcpServerInputSchema } from './ProfileMcpServerUncheckedCreateWithoutMcpServerInputSchema';
import { ProfileMcpServerCreateOrConnectWithoutMcpServerInputSchema } from './ProfileMcpServerCreateOrConnectWithoutMcpServerInputSchema';
import { ProfileMcpServerCreateManyMcpServerInputEnvelopeSchema } from './ProfileMcpServerCreateManyMcpServerInputEnvelopeSchema';
import { ProfileMcpServerWhereUniqueInputSchema } from './ProfileMcpServerWhereUniqueInputSchema';

export const ProfileMcpServerUncheckedCreateNestedManyWithoutMcpServerInputSchema: z.ZodType<Prisma.ProfileMcpServerUncheckedCreateNestedManyWithoutMcpServerInput> = z.strictObject({
  create: z.union([ z.lazy(() => ProfileMcpServerCreateWithoutMcpServerInputSchema), z.lazy(() => ProfileMcpServerCreateWithoutMcpServerInputSchema).array(), z.lazy(() => ProfileMcpServerUncheckedCreateWithoutMcpServerInputSchema), z.lazy(() => ProfileMcpServerUncheckedCreateWithoutMcpServerInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ProfileMcpServerCreateOrConnectWithoutMcpServerInputSchema), z.lazy(() => ProfileMcpServerCreateOrConnectWithoutMcpServerInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ProfileMcpServerCreateManyMcpServerInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => ProfileMcpServerWhereUniqueInputSchema), z.lazy(() => ProfileMcpServerWhereUniqueInputSchema).array() ]).optional(),
});

export default ProfileMcpServerUncheckedCreateNestedManyWithoutMcpServerInputSchema;
