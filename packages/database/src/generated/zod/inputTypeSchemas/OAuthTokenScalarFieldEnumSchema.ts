import { z } from 'zod';

export const OAuthTokenScalarFieldEnumSchema = z.enum(['id','mcpServerId','accessToken','refreshToken','tokenType','scope','expiresAt','createdAt','updatedAt']);

export default OAuthTokenScalarFieldEnumSchema;
