import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { McpServerToolsCacheCreateManyMcpServerInputSchema } from './McpServerToolsCacheCreateManyMcpServerInputSchema';

export const McpServerToolsCacheCreateManyMcpServerInputEnvelopeSchema: z.ZodType<Prisma.McpServerToolsCacheCreateManyMcpServerInputEnvelope> = z.strictObject({
  data: z.union([ z.lazy(() => McpServerToolsCacheCreateManyMcpServerInputSchema), z.lazy(() => McpServerToolsCacheCreateManyMcpServerInputSchema).array() ]),
});

export default McpServerToolsCacheCreateManyMcpServerInputEnvelopeSchema;
