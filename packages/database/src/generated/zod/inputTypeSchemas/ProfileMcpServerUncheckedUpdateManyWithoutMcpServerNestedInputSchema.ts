import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileMcpServerCreateWithoutMcpServerInputSchema } from './ProfileMcpServerCreateWithoutMcpServerInputSchema';
import { ProfileMcpServerUncheckedCreateWithoutMcpServerInputSchema } from './ProfileMcpServerUncheckedCreateWithoutMcpServerInputSchema';
import { ProfileMcpServerCreateOrConnectWithoutMcpServerInputSchema } from './ProfileMcpServerCreateOrConnectWithoutMcpServerInputSchema';
import { ProfileMcpServerUpsertWithWhereUniqueWithoutMcpServerInputSchema } from './ProfileMcpServerUpsertWithWhereUniqueWithoutMcpServerInputSchema';
import { ProfileMcpServerCreateManyMcpServerInputEnvelopeSchema } from './ProfileMcpServerCreateManyMcpServerInputEnvelopeSchema';
import { ProfileMcpServerWhereUniqueInputSchema } from './ProfileMcpServerWhereUniqueInputSchema';
import { ProfileMcpServerUpdateWithWhereUniqueWithoutMcpServerInputSchema } from './ProfileMcpServerUpdateWithWhereUniqueWithoutMcpServerInputSchema';
import { ProfileMcpServerUpdateManyWithWhereWithoutMcpServerInputSchema } from './ProfileMcpServerUpdateManyWithWhereWithoutMcpServerInputSchema';
import { ProfileMcpServerScalarWhereInputSchema } from './ProfileMcpServerScalarWhereInputSchema';

export const ProfileMcpServerUncheckedUpdateManyWithoutMcpServerNestedInputSchema: z.ZodType<Prisma.ProfileMcpServerUncheckedUpdateManyWithoutMcpServerNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => ProfileMcpServerCreateWithoutMcpServerInputSchema), z.lazy(() => ProfileMcpServerCreateWithoutMcpServerInputSchema).array(), z.lazy(() => ProfileMcpServerUncheckedCreateWithoutMcpServerInputSchema), z.lazy(() => ProfileMcpServerUncheckedCreateWithoutMcpServerInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ProfileMcpServerCreateOrConnectWithoutMcpServerInputSchema), z.lazy(() => ProfileMcpServerCreateOrConnectWithoutMcpServerInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => ProfileMcpServerUpsertWithWhereUniqueWithoutMcpServerInputSchema), z.lazy(() => ProfileMcpServerUpsertWithWhereUniqueWithoutMcpServerInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ProfileMcpServerCreateManyMcpServerInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => ProfileMcpServerWhereUniqueInputSchema), z.lazy(() => ProfileMcpServerWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => ProfileMcpServerWhereUniqueInputSchema), z.lazy(() => ProfileMcpServerWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => ProfileMcpServerWhereUniqueInputSchema), z.lazy(() => ProfileMcpServerWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => ProfileMcpServerWhereUniqueInputSchema), z.lazy(() => ProfileMcpServerWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => ProfileMcpServerUpdateWithWhereUniqueWithoutMcpServerInputSchema), z.lazy(() => ProfileMcpServerUpdateWithWhereUniqueWithoutMcpServerInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => ProfileMcpServerUpdateManyWithWhereWithoutMcpServerInputSchema), z.lazy(() => ProfileMcpServerUpdateManyWithWhereWithoutMcpServerInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => ProfileMcpServerScalarWhereInputSchema), z.lazy(() => ProfileMcpServerScalarWhereInputSchema).array() ]).optional(),
});

export default ProfileMcpServerUncheckedUpdateManyWithoutMcpServerNestedInputSchema;
