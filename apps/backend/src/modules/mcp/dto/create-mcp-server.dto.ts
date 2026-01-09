/**
 * Create MCP Server DTO
 */

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

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

export class CreateMcpServerDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  type!: 'builtin' | 'stdio' | 'sse' | 'streamable-http';

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
