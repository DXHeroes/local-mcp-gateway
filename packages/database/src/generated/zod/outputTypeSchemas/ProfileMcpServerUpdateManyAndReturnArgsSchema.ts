import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { ProfileMcpServerUpdateManyMutationInputSchema } from '../inputTypeSchemas/ProfileMcpServerUpdateManyMutationInputSchema'
import { ProfileMcpServerUncheckedUpdateManyInputSchema } from '../inputTypeSchemas/ProfileMcpServerUncheckedUpdateManyInputSchema'
import { ProfileMcpServerWhereInputSchema } from '../inputTypeSchemas/ProfileMcpServerWhereInputSchema'

export const ProfileMcpServerUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.ProfileMcpServerUpdateManyAndReturnArgs> = z.object({
  data: z.union([ ProfileMcpServerUpdateManyMutationInputSchema, ProfileMcpServerUncheckedUpdateManyInputSchema ]),
  where: ProfileMcpServerWhereInputSchema.optional(), 
  limit: z.number().optional(),
}).strict();

export default ProfileMcpServerUpdateManyAndReturnArgsSchema;
