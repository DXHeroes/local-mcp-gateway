import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileMcpServerCreateWithoutProfileInputSchema } from './ProfileMcpServerCreateWithoutProfileInputSchema';
import { ProfileMcpServerUncheckedCreateWithoutProfileInputSchema } from './ProfileMcpServerUncheckedCreateWithoutProfileInputSchema';
import { ProfileMcpServerCreateOrConnectWithoutProfileInputSchema } from './ProfileMcpServerCreateOrConnectWithoutProfileInputSchema';
import { ProfileMcpServerUpsertWithWhereUniqueWithoutProfileInputSchema } from './ProfileMcpServerUpsertWithWhereUniqueWithoutProfileInputSchema';
import { ProfileMcpServerCreateManyProfileInputEnvelopeSchema } from './ProfileMcpServerCreateManyProfileInputEnvelopeSchema';
import { ProfileMcpServerWhereUniqueInputSchema } from './ProfileMcpServerWhereUniqueInputSchema';
import { ProfileMcpServerUpdateWithWhereUniqueWithoutProfileInputSchema } from './ProfileMcpServerUpdateWithWhereUniqueWithoutProfileInputSchema';
import { ProfileMcpServerUpdateManyWithWhereWithoutProfileInputSchema } from './ProfileMcpServerUpdateManyWithWhereWithoutProfileInputSchema';
import { ProfileMcpServerScalarWhereInputSchema } from './ProfileMcpServerScalarWhereInputSchema';

export const ProfileMcpServerUpdateManyWithoutProfileNestedInputSchema: z.ZodType<Prisma.ProfileMcpServerUpdateManyWithoutProfileNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => ProfileMcpServerCreateWithoutProfileInputSchema), z.lazy(() => ProfileMcpServerCreateWithoutProfileInputSchema).array(), z.lazy(() => ProfileMcpServerUncheckedCreateWithoutProfileInputSchema), z.lazy(() => ProfileMcpServerUncheckedCreateWithoutProfileInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ProfileMcpServerCreateOrConnectWithoutProfileInputSchema), z.lazy(() => ProfileMcpServerCreateOrConnectWithoutProfileInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => ProfileMcpServerUpsertWithWhereUniqueWithoutProfileInputSchema), z.lazy(() => ProfileMcpServerUpsertWithWhereUniqueWithoutProfileInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ProfileMcpServerCreateManyProfileInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => ProfileMcpServerWhereUniqueInputSchema), z.lazy(() => ProfileMcpServerWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => ProfileMcpServerWhereUniqueInputSchema), z.lazy(() => ProfileMcpServerWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => ProfileMcpServerWhereUniqueInputSchema), z.lazy(() => ProfileMcpServerWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => ProfileMcpServerWhereUniqueInputSchema), z.lazy(() => ProfileMcpServerWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => ProfileMcpServerUpdateWithWhereUniqueWithoutProfileInputSchema), z.lazy(() => ProfileMcpServerUpdateWithWhereUniqueWithoutProfileInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => ProfileMcpServerUpdateManyWithWhereWithoutProfileInputSchema), z.lazy(() => ProfileMcpServerUpdateManyWithWhereWithoutProfileInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => ProfileMcpServerScalarWhereInputSchema), z.lazy(() => ProfileMcpServerScalarWhereInputSchema).array() ]).optional(),
});

export default ProfileMcpServerUpdateManyWithoutProfileNestedInputSchema;
