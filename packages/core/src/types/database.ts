/**
 * Database entity types
 *
 * These types are re-exported from @local-mcp/database for convenience
 * but defined here to avoid circular dependencies.
 */

/**
 * OAuth token entity
 */
export interface OAuthToken {
  id: string;
  mcpServerId: string;
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresAt?: number; // Unix timestamp, nullable for tokens without expiration
  scope?: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * OAuth client registration entity
 */
export interface OAuthClientRegistration {
  id: string;
  mcpServerId: string;
  authorizationServerUrl: string;
  clientId: string;
  clientSecret?: string; // Nullable for public clients
  registrationAccessToken?: string; // For Dynamic Client Registration
  createdAt: number;
  updatedAt: number;
}

/**
 * Debug log entity
 */
export interface DebugLog {
  id: string;
  profileId: string;
  mcpServerId?: string;
  requestType: string; // 'tools/call', 'resources/read', etc.
  requestPayload: string; // JSON string
  responsePayload?: string; // JSON string, nullable for pending requests
  status: 'pending' | 'success' | 'error';
  errorMessage?: string;
  durationMs?: number;
  createdAt: number;
}

/**
 * Database migration entity
 */
export interface Migration {
  id: string;
  name: string;
  executedAt: number;
}
