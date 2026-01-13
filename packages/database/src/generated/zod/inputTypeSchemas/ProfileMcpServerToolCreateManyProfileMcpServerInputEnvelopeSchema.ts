import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileMcpServerToolCreateManyProfileMcpServerInputSchema } from './ProfileMcpServerToolCreateManyProfileMcpServerInputSchema';

export const ProfileMcpServerToolCreateManyProfileMcpServerInputEnvelopeSchema: z.ZodType<Prisma.ProfileMcpServerToolCreateManyProfileMcpServerInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => ProfileMcpServerToolCreateManyProfileMcpServerInputSchema), z.lazy(() => ProfileMcpServerToolCreateManyProfileMcpServerInputSchema).array() ]),
});

export default ProfileMcpServerToolCreateManyProfileMcpServerInputEnvelopeSchema;
