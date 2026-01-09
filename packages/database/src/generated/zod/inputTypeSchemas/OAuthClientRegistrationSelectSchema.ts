import { z } from 'zod';
import type { Prisma } from '../../prisma';
import { McpServerArgsSchema } from "../outputTypeSchemas/McpServerArgsSchema"

export const OAuthClientRegistrationSelectSchema: z.ZodType<Prisma.OAuthClientRegistrationSelect> = z.object({
  id: z.boolean().optional(),
  mcpServerId: z.boolean().optional(),
  authorizationServerUrl: z.boolean().optional(),
  clientId: z.boolean().optional(),
  clientSecret: z.boolean().optional(),
  registrationAccessToken: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  mcpServer: z.union([z.boolean(),z.lazy(() => McpServerArgsSchema)]).optional(),
}).strict()

export default OAuthClientRegistrationSelectSchema;
