import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { SortOrderSchema } from './SortOrderSchema';
import { SortOrderInputSchema } from './SortOrderInputSchema';
import { ProfileMcpServerOrderByWithRelationInputSchema } from './ProfileMcpServerOrderByWithRelationInputSchema';

export const ProfileMcpServerToolOrderByWithRelationInputSchema: z.ZodType<Prisma.ProfileMcpServerToolOrderByWithRelationInput> = z.strictObject({
  id: z.lazy(() => SortOrderSchema).optional(),
  profileMcpServerId: z.lazy(() => SortOrderSchema).optional(),
  toolName: z.lazy(() => SortOrderSchema).optional(),
  isEnabled: z.lazy(() => SortOrderSchema).optional(),
  customName: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  customDescription: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  customInputSchema: z.union([ z.lazy(() => SortOrderSchema), z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  profileMcpServer: z.lazy(() => ProfileMcpServerOrderByWithRelationInputSchema).optional(),
});

export default ProfileMcpServerToolOrderByWithRelationInputSchema;
