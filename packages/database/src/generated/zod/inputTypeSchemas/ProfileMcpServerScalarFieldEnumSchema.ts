import { z } from 'zod';

export const ProfileMcpServerScalarFieldEnumSchema = z.enum(['id','profileId','mcpServerId','order','isActive','createdAt','updatedAt']);

export default ProfileMcpServerScalarFieldEnumSchema;
