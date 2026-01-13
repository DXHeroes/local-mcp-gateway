import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { DebugLogCreateManyProfileInputSchema } from './DebugLogCreateManyProfileInputSchema';

export const DebugLogCreateManyProfileInputEnvelopeSchema: z.ZodType<Prisma.DebugLogCreateManyProfileInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => DebugLogCreateManyProfileInputSchema), z.lazy(() => DebugLogCreateManyProfileInputSchema).array() ]),
});

export default DebugLogCreateManyProfileInputEnvelopeSchema;
