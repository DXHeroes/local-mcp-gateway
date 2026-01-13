import { z } from 'zod';

export const OAuthClientRegistrationScalarFieldEnumSchema = z.enum(['id','mcpServerId','authorizationServerUrl','clientId','clientSecret','registrationAccessToken','createdAt','updatedAt']);

export default OAuthClientRegistrationScalarFieldEnumSchema;
