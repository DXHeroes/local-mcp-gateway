/**
 * Update MCP Server DTO
 */

import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';

class ApiKeyConfigDto {
  @IsString()
  apiKey!: string;

  @IsString()
  @IsOptional()
  headerName?: string;

  @IsString()
  @IsOptional()
  headerValue?: string;
}

class OAuthConfigDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  scopes?: string[];

  @IsString()
  @IsOptional()
  authorizationServerUrl?: string;
}

export class UpdateMcpServerDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  type?: 'builtin' | 'stdio' | 'sse' | 'streamable-http';

  @IsOptional()
  config?: Record<string, unknown> | string;

  @ValidateNested()
  @Type(() => ApiKeyConfigDto)
  @IsOptional()
  apiKeyConfig?: ApiKeyConfigDto | null;

  @ValidateNested()
  @Type(() => OAuthConfigDto)
  @IsOptional()
  oauthConfig?: OAuthConfigDto | null;
}
