import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { DebugLogCreateManyMcpServerInputSchema } from './DebugLogCreateManyMcpServerInputSchema';

export const DebugLogCreateManyMcpServerInputEnvelopeSchema: z.ZodType<Prisma.DebugLogCreateManyMcpServerInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => DebugLogCreateManyMcpServerInputSchema), z.lazy(() => DebugLogCreateManyMcpServerInputSchema).array() ]),
});

export default DebugLogCreateManyMcpServerInputEnvelopeSchema;
