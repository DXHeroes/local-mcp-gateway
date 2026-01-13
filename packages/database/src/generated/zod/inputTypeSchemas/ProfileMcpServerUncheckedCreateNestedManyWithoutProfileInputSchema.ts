import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileMcpServerCreateWithoutProfileInputSchema } from './ProfileMcpServerCreateWithoutProfileInputSchema';
import { ProfileMcpServerUncheckedCreateWithoutProfileInputSchema } from './ProfileMcpServerUncheckedCreateWithoutProfileInputSchema';
import { ProfileMcpServerCreateOrConnectWithoutProfileInputSchema } from './ProfileMcpServerCreateOrConnectWithoutProfileInputSchema';
import { ProfileMcpServerCreateManyProfileInputEnvelopeSchema } from './ProfileMcpServerCreateManyProfileInputEnvelopeSchema';
import { ProfileMcpServerWhereUniqueInputSchema } from './ProfileMcpServerWhereUniqueInputSchema';

export const ProfileMcpServerUncheckedCreateNestedManyWithoutProfileInputSchema: z.ZodType<Prisma.ProfileMcpServerUncheckedCreateNestedManyWithoutProfileInput> = z.strictObject({
  create: z.union([ z.lazy(() => ProfileMcpServerCreateWithoutProfileInputSchema), z.lazy(() => ProfileMcpServerCreateWithoutProfileInputSchema).array(), z.lazy(() => ProfileMcpServerUncheckedCreateWithoutProfileInputSchema), z.lazy(() => ProfileMcpServerUncheckedCreateWithoutProfileInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ProfileMcpServerCreateOrConnectWithoutProfileInputSchema), z.lazy(() => ProfileMcpServerCreateOrConnectWithoutProfileInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ProfileMcpServerCreateManyProfileInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => ProfileMcpServerWhereUniqueInputSchema), z.lazy(() => ProfileMcpServerWhereUniqueInputSchema).array() ]).optional(),
});

export default ProfileMcpServerUncheckedCreateNestedManyWithoutProfileInputSchema;
