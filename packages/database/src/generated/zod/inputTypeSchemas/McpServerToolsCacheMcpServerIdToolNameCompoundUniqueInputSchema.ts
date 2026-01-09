import type { Prisma } from '../../prisma';

import { z } from 'zod';

export const McpServerToolsCacheMcpServerIdToolNameCompoundUniqueInputSchema: z.ZodType<Prisma.McpServerToolsCacheMcpServerIdToolNameCompoundUniqueInput> = z.strictObject({
  mcpServerId: z.string(),
  toolName: z.string(),
});

export default McpServerToolsCacheMcpServerIdToolNameCompoundUniqueInputSchema;
