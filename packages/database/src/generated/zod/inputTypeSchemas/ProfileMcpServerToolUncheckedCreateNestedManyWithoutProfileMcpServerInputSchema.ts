import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileMcpServerToolCreateWithoutProfileMcpServerInputSchema } from './ProfileMcpServerToolCreateWithoutProfileMcpServerInputSchema';
import { ProfileMcpServerToolUncheckedCreateWithoutProfileMcpServerInputSchema } from './ProfileMcpServerToolUncheckedCreateWithoutProfileMcpServerInputSchema';
import { ProfileMcpServerToolCreateOrConnectWithoutProfileMcpServerInputSchema } from './ProfileMcpServerToolCreateOrConnectWithoutProfileMcpServerInputSchema';
import { ProfileMcpServerToolCreateManyProfileMcpServerInputEnvelopeSchema } from './ProfileMcpServerToolCreateManyProfileMcpServerInputEnvelopeSchema';
import { ProfileMcpServerToolWhereUniqueInputSchema } from './ProfileMcpServerToolWhereUniqueInputSchema';

export const ProfileMcpServerToolUncheckedCreateNestedManyWithoutProfileMcpServerInputSchema: z.ZodType<Prisma.ProfileMcpServerToolUncheckedCreateNestedManyWithoutProfileMcpServerInput> = z.strictObject({
  create: z.union([ z.lazy(() => ProfileMcpServerToolCreateWithoutProfileMcpServerInputSchema), z.lazy(() => ProfileMcpServerToolCreateWithoutProfileMcpServerInputSchema).array(), z.lazy(() => ProfileMcpServerToolUncheckedCreateWithoutProfileMcpServerInputSchema), z.lazy(() => ProfileMcpServerToolUncheckedCreateWithoutProfileMcpServerInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => ProfileMcpServerToolCreateOrConnectWithoutProfileMcpServerInputSchema), z.lazy(() => ProfileMcpServerToolCreateOrConnectWithoutProfileMcpServerInputSchema).array() ]).optional(),
  createMany: z.lazy(() => ProfileMcpServerToolCreateManyProfileMcpServerInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => ProfileMcpServerToolWhereUniqueInputSchema), z.lazy(() => ProfileMcpServerToolWhereUniqueInputSchema).array() ]).optional(),
});

export default ProfileMcpServerToolUncheckedCreateNestedManyWithoutProfileMcpServerInputSchema;
