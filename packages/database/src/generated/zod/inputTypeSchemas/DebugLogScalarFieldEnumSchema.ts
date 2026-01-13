import { z } from 'zod';

export const DebugLogScalarFieldEnumSchema = z.enum(['id','profileId','mcpServerId','requestType','requestPayload','responsePayload','status','errorMessage','durationMs','createdAt']);

export default DebugLogScalarFieldEnumSchema;
