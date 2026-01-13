import type { Prisma } from '../../prisma';

import { z } from 'zod';
import { OAuthClientRegistrationCreateWithoutMcpServerInputSchema } from './OAuthClientRegistrationCreateWithoutMcpServerInputSchema';
import { OAuthClientRegistrationUncheckedCreateWithoutMcpServerInputSchema } from './OAuthClientRegistrationUncheckedCreateWithoutMcpServerInputSchema';
import { OAuthClientRegistrationCreateOrConnectWithoutMcpServerInputSchema } from './OAuthClientRegistrationCreateOrConnectWithoutMcpServerInputSchema';
import { OAuthClientRegistrationUpsertWithWhereUniqueWithoutMcpServerInputSchema } from './OAuthClientRegistrationUpsertWithWhereUniqueWithoutMcpServerInputSchema';
import { OAuthClientRegistrationCreateManyMcpServerInputEnvelopeSchema } from './OAuthClientRegistrationCreateManyMcpServerInputEnvelopeSchema';
import { OAuthClientRegistrationWhereUniqueInputSchema } from './OAuthClientRegistrationWhereUniqueInputSchema';
import { OAuthClientRegistrationUpdateWithWhereUniqueWithoutMcpServerInputSchema } from './OAuthClientRegistrationUpdateWithWhereUniqueWithoutMcpServerInputSchema';
import { OAuthClientRegistrationUpdateManyWithWhereWithoutMcpServerInputSchema } from './OAuthClientRegistrationUpdateManyWithWhereWithoutMcpServerInputSchema';
import { OAuthClientRegistrationScalarWhereInputSchema } from './OAuthClientRegistrationScalarWhereInputSchema';

export const OAuthClientRegistrationUpdateManyWithoutMcpServerNestedInputSchema: z.ZodType<Prisma.OAuthClientRegistrationUpdateManyWithoutMcpServerNestedInput> = z.strictObject({
  create: z.union([ z.lazy(() => OAuthClientRegistrationCreateWithoutMcpServerInputSchema), z.lazy(() => OAuthClientRegistrationCreateWithoutMcpServerInputSchema).array(), z.lazy(() => OAuthClientRegistrationUncheckedCreateWithoutMcpServerInputSchema), z.lazy(() => OAuthClientRegistrationUncheckedCreateWithoutMcpServerInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => OAuthClientRegistrationCreateOrConnectWithoutMcpServerInputSchema), z.lazy(() => OAuthClientRegistrationCreateOrConnectWithoutMcpServerInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => OAuthClientRegistrationUpsertWithWhereUniqueWithoutMcpServerInputSchema), z.lazy(() => OAuthClientRegistrationUpsertWithWhereUniqueWithoutMcpServerInputSchema).array() ]).optional(),
  createMany: z.lazy(() => OAuthClientRegistrationCreateManyMcpServerInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => OAuthClientRegistrationWhereUniqueInputSchema), z.lazy(() => OAuthClientRegistrationWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => OAuthClientRegistrationWhereUniqueInputSchema), z.lazy(() => OAuthClientRegistrationWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => OAuthClientRegistrationWhereUniqueInputSchema), z.lazy(() => OAuthClientRegistrationWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => OAuthClientRegistrationWhereUniqueInputSchema), z.lazy(() => OAuthClientRegistrationWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => OAuthClientRegistrationUpdateWithWhereUniqueWithoutMcpServerInputSchema), z.lazy(() => OAuthClientRegistrationUpdateWithWhereUniqueWithoutMcpServerInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => OAuthClientRegistrationUpdateManyWithWhereWithoutMcpServerInputSchema), z.lazy(() => OAuthClientRegistrationUpdateManyWithWhereWithoutMcpServerInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => OAuthClientRegistrationScalarWhereInputSchema), z.lazy(() => OAuthClientRegistrationScalarWhereInputSchema).array() ]).optional(),
});

export default OAuthClientRegistrationUpdateManyWithoutMcpServerNestedInputSchema;
