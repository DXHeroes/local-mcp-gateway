import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { ProfileMcpServerWhereInputSchema } from './ProfileMcpServerWhereInputSchema';
import { ProfileMcpServerUpdateWithoutToolsInputSchema } from './ProfileMcpServerUpdateWithoutToolsInputSchema';
import { ProfileMcpServerUncheckedUpdateWithoutToolsInputSchema } from './ProfileMcpServerUncheckedUpdateWithoutToolsInputSchema';

export const ProfileMcpServerUpdateToOneWithWhereWithoutToolsInputSchema: z.ZodType<Prisma.ProfileMcpServerUpdateToOneWithWhereWithoutToolsInput> = z.strictObject({
  where: z.lazy(() => ProfileMcpServerWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => ProfileMcpServerUpdateWithoutToolsInputSchema), z.lazy(() => ProfileMcpServerUncheckedUpdateWithoutToolsInputSchema) ]),
});

export default ProfileMcpServerUpdateToOneWithWhereWithoutToolsInputSchema;
