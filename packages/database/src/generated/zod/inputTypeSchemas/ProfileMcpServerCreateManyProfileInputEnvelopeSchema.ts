import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileMcpServerCreateManyProfileInputSchema } from './ProfileMcpServerCreateManyProfileInputSchema';

export const ProfileMcpServerCreateManyProfileInputEnvelopeSchema: z.ZodType<Prisma.ProfileMcpServerCreateManyProfileInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => ProfileMcpServerCreateManyProfileInputSchema), z.lazy(() => ProfileMcpServerCreateManyProfileInputSchema).array() ]),
});

export default ProfileMcpServerCreateManyProfileInputEnvelopeSchema;
