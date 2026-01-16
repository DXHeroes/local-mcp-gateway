import { z } from 'zod';

/////////////////////////////////////////
// GATEWAY SETTING SCHEMA
/////////////////////////////////////////

/**
 * Key-value store for gateway configuration
 */
export const GatewaySettingSchema = z.object({
  id: z.uuid(),
  key: z.string(),
  value: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type GatewaySetting = z.infer<typeof GatewaySettingSchema>

/////////////////////////////////////////
// GATEWAY SETTING OPTIONAL DEFAULTS SCHEMA
/////////////////////////////////////////

export const GatewaySettingOptionalDefaultsSchema = GatewaySettingSchema.merge(z.object({
  id: z.uuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
}))

export type GatewaySettingOptionalDefaults = z.infer<typeof GatewaySettingOptionalDefaultsSchema>

export default GatewaySettingSchema;
