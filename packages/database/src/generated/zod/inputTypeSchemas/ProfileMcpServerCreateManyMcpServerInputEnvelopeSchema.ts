import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileMcpServerCreateManyMcpServerInputSchema } from './ProfileMcpServerCreateManyMcpServerInputSchema';

export const ProfileMcpServerCreateManyMcpServerInputEnvelopeSchema: z.ZodType<Prisma.ProfileMcpServerCreateManyMcpServerInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => ProfileMcpServerCreateManyMcpServerInputSchema), z.lazy(() => ProfileMcpServerCreateManyMcpServerInputSchema).array() ]),
});

export default ProfileMcpServerCreateManyMcpServerInputEnvelopeSchema;
