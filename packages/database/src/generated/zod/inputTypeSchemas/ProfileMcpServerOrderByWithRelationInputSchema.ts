import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { ProfileOrderByWithRelationInputSchema } from './ProfileOrderByWithRelationInputSchema';
import { McpServerOrderByWithRelationInputSchema } from './McpServerOrderByWithRelationInputSchema';
import { ProfileMcpServerToolOrderByRelationAggregateInputSchema } from './ProfileMcpServerToolOrderByRelationAggregateInputSchema';

export const ProfileMcpServerOrderByWithRelationInputSchema: z.ZodType<Prisma.ProfileMcpServerOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  profileId: z.lazy(() => SortOrderSchema).optional(),
  mcpServerId: z.lazy(() => SortOrderSchema).optional(),
  order: z.lazy(() => SortOrderSchema).optional(),
  isActive: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  profile: z.lazy(() => ProfileOrderByWithRelationInputSchema).optional(),
  mcpServer: z.lazy(() => McpServerOrderByWithRelationInputSchema).optional(),
  tools: z.lazy(() => ProfileMcpServerToolOrderByRelationAggregateInputSchema).optional(),
});

export default ProfileMcpServerOrderByWithRelationInputSchema;
