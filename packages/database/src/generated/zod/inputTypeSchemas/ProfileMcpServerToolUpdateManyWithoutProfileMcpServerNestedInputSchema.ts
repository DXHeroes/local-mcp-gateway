import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileMcpServerToolCreateWithoutProfileMcpServerInputSchema } from './ProfileMcpServerToolCreateWithoutProfileMcpServerInputSchema';
import { ProfileMcpServerToolUncheckedCreateWithoutProfileMcpServerInputSchema } from './ProfileMcpServerToolUncheckedCreateWithoutProfileMcpServerInputSchema';
import { ProfileMcpServerToolCreateOrConnectWithoutProfileMcpServerInputSchema } from './ProfileMcpServerToolCreateOrConnectWithoutProfileMcpServerInputSchema';
import { ProfileMcpServerToolUpsertWithWhereUniqueWithoutProfileMcpServerInputSchema } from './ProfileMcpServerToolUpsertWithWhereUniqueWithoutProfileMcpServerInputSchema';
import { ProfileMcpServerToolCreateManyProfileMcpServerInputEnvelopeSchema } from './ProfileMcpServerToolCreateManyProfileMcpServerInputEnvelopeSchema';
import { ProfileMcpServerToolWhereUniqueInputSchema } from './ProfileMcpServerToolWhereUniqueInputSchema';
import { ProfileMcpServerToolUpdateWithWhereUniqueWithoutProfileMcpServerInputSchema } from './ProfileMcpServerToolUpdateWithWhereUniqueWithoutProfileMcpServerInputSchema';
import { ProfileMcpServerToolUpdateManyWithWhereWithoutProfileMcpServerInputSchema } from './ProfileMcpServerToolUpdateManyWithWhereWithoutProfileMcpServerInputSchema';
import { ProfileMcpServerToolScalarWhereInputSchema } from './ProfileMcpServerToolScalarWhereInputSchema';

export const ProfileMcpServerToolUpdateManyWithoutProfileMcpServerNestedInputSchema: z.ZodType<Prisma.ProfileMcpServerToolUpdateManyWithoutProfileMcpServerNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => ProfileMcpServerToolCreateWithoutProfileMcpServerInputSchema), z.lazy(() => ProfileMcpServerToolCreateWithoutProfileMcpServerInputSchema).array(), z.lazy(() => ProfileMcpServerToolUncheckedCreateWithoutProfileMcpServerInputSchema), z.lazy(() => ProfileMcpServerToolUncheckedCreateWithoutProfileMcpServerInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ProfileMcpServerToolCreateOrConnectWithoutProfileMcpServerInputSchema), z.lazy(() => ProfileMcpServerToolCreateOrConnectWithoutProfileMcpServerInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => ProfileMcpServerToolUpsertWithWhereUniqueWithoutProfileMcpServerInputSchema), z.lazy(() => ProfileMcpServerToolUpsertWithWhereUniqueWithoutProfileMcpServerInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ProfileMcpServerToolCreateManyProfileMcpServerInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => ProfileMcpServerToolWhereUniqueInputSchema), z.lazy(() => ProfileMcpServerToolWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => ProfileMcpServerToolWhereUniqueInputSchema), z.lazy(() => ProfileMcpServerToolWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => ProfileMcpServerToolWhereUniqueInputSchema), z.lazy(() => ProfileMcpServerToolWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => ProfileMcpServerToolWhereUniqueInputSchema), z.lazy(() => ProfileMcpServerToolWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => ProfileMcpServerToolUpdateWithWhereUniqueWithoutProfileMcpServerInputSchema), z.lazy(() => ProfileMcpServerToolUpdateWithWhereUniqueWithoutProfileMcpServerInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => ProfileMcpServerToolUpdateManyWithWhereWithoutProfileMcpServerInputSchema), z.lazy(() => ProfileMcpServerToolUpdateManyWithWhereWithoutProfileMcpServerInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => ProfileMcpServerToolScalarWhereInputSchema), z.lazy(() => ProfileMcpServerToolScalarWhereInputSchema).array() ]).optional(),
});

export default ProfileMcpServerToolUpdateManyWithoutProfileMcpServerNestedInputSchema;
