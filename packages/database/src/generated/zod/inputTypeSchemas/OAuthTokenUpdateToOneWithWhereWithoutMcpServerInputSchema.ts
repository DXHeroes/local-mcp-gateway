import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { OAuthTokenWhereInputSchema } from './OAuthTokenWhereInputSchema';
import { OAuthTokenUpdateWithoutMcpServerInputSchema } from './OAuthTokenUpdateWithoutMcpServerInputSchema';
import { OAuthTokenUncheckedUpdateWithoutMcpServerInputSchema } from './OAuthTokenUncheckedUpdateWithoutMcpServerInputSchema';

export const OAuthTokenUpdateToOneWithWhereWithoutMcpServerInputSchema: z.ZodType<Prisma.OAuthTokenUpdateToOneWithWhereWithoutMcpServerInput> = z.strictObject({
  where: z.lazy(() => OAuthTokenWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => OAuthTokenUpdateWithoutMcpServerInputSchema), z.lazy(() => OAuthTokenUncheckedUpdateWithoutMcpServerInputSchema) ]),
});

export default OAuthTokenUpdateToOneWithWhereWithoutMcpServerInputSchema;
