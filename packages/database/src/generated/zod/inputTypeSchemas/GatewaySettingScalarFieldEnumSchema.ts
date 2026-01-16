import { z } from 'zod';

export const GatewaySettingScalarFieldEnumSchema = z.enum(['id','key','value','createdAt','updatedAt']);

export default GatewaySettingScalarFieldEnumSchema;
