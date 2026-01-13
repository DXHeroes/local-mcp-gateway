import type { Prisma } from '../../prisma';

import { z } from 'zod';

export const McpServerCreateManyInputSchema: z.ZodType<Prisma.McpServerCreateManyInput> = z.strictObject({
  id: z.uuid().optional(),
  name: z.string(),
  type: z.string(),
  config: z.string().optional(),
  oauthConfig: z.string().optional().nullable(),
  apiKeyConfig: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export default McpServerCreateManyInputSchema;
