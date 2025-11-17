/**
 * OAuth Discovery Service
 *
 * Implements OAuth discovery according to MCP authenticated remote spec:
 * - Protected Resource Metadata (RFC 9728)
 * - Authorization Server Metadata (RFC 8414)
 * - Dynamic Client Registration (RFC 7591)
 */

export interface ProtectedResourceMetadata {
  authorization_servers: string[];
  resource: string;
}

export interface AuthorizationServerMetadata {
  authorization_endpoint: string;
  token_endpoint: string;
  registration_endpoint?: string; // For DCR
  scopes_supported?: string[];
  response_types_supported?: string[];
  grant_types_supported?: string[];
}

export interface OAuthDiscoveryResult {
  authorizationServerUrl: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  registrationEndpoint?: string;
  scopes: string[];
  resource?: string;
}

export class OAuthDiscoveryService {
  /**
   * Discover OAuth configuration from MCP server URL using RFC9728 Protected Resource Metadata
   * Tries well-known URIs in order:
   * 1. At the path of the server's MCP endpoint: `https://example.com/.well-known/oauth-protected-resource/public/mcp`
   * 2. At the root: `https://example.com/.well-known/oauth-protected-resource`
   */
  async discoverFromServerUrl(serverUrl: string): Promise<OAuthDiscoveryResult> {
    const urlObj = new URL(serverUrl);
    const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
    const path = urlObj.pathname;

    // Try well-known URIs according to RFC9728
    const wellKnownUrls: string[] = [];

    // 1. At the path of the server's MCP endpoint (if path exists and is not just "/")
    if (path && path !== '/' && path !== '/mcp' && path !== '/sse') {
      // Extract path component (e.g., "/public/mcp" -> "public/mcp")
      const pathComponent = path.startsWith('/') ? path.slice(1) : path;
      wellKnownUrls.push(`${baseUrl}/.well-known/oauth-protected-resource/${pathComponent}`);
    }

    // 2. At the root
    wellKnownUrls.push(`${baseUrl}/.well-known/oauth-protected-resource`);

    // Try each well-known URI until one succeeds
    for (const wellKnownUrl of wellKnownUrls) {
      try {
        const response = await fetch(wellKnownUrl);
        if (response.ok) {
          const resourceMetadata = (await response.json()) as ProtectedResourceMetadata;
          return await this.discoverFromProtectedResourceMetadata(resourceMetadata);
        }
      } catch (_error) {}
    }

    throw new Error(
      `Failed to discover Protected Resource Metadata from well-known URIs for ${serverUrl}`
    );
  }

  /**
   * Discover OAuth configuration from Protected Resource Metadata
   */
  private async discoverFromProtectedResourceMetadata(
    resourceMetadata: ProtectedResourceMetadata
  ): Promise<OAuthDiscoveryResult> {
    if (
      !resourceMetadata.authorization_servers ||
      resourceMetadata.authorization_servers.length === 0
    ) {
      throw new Error('No authorization servers found in resource metadata');
    }

    // Use first authorization server (client can select which one to use)
    const authorizationServerUrl = resourceMetadata.authorization_servers[0];
    if (!authorizationServerUrl) {
      throw new Error('Invalid authorization server URL');
    }

    // Discover Authorization Server Metadata according to RFC8414
    const serverMetadata = await this.discoverAuthorizationServerMetadata(authorizationServerUrl);

    return {
      authorizationServerUrl,
      authorizationEndpoint: serverMetadata.authorization_endpoint,
      tokenEndpoint: serverMetadata.token_endpoint,
      registrationEndpoint: serverMetadata.registration_endpoint,
      scopes: serverMetadata.scopes_supported || ['read', 'write'],
      resource: resourceMetadata.resource,
    };
  }

  /**
   * Discover Authorization Server Metadata according to RFC8414
   * Tries multiple well-known endpoints for compatibility with both OAuth 2.0 and OpenID Connect
   * Also tries API subdomain variants (e.g., api.example.com if authorization server is example.com)
   */
  private async discoverAuthorizationServerMetadata(
    authorizationServerUrl: string
  ): Promise<AuthorizationServerMetadata> {
    const urlObj = new URL(authorizationServerUrl);
    const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
    const path = urlObj.pathname;

    // Try well-known endpoints according to RFC8414 Section 3.1 and Section 5 (compatibility)
    const wellKnownUrls: string[] = [];

    // For issuer URLs with path components, try with path insertion
    if (path && path !== '/') {
      const pathComponent = path.startsWith('/') ? path.slice(1) : path;
      // OAuth 2.0 Authorization Server Metadata with path insertion
      wellKnownUrls.push(`${baseUrl}/.well-known/oauth-authorization-server/${pathComponent}`);
      // OpenID Connect Discovery 1.0 with path insertion
      wellKnownUrls.push(`${baseUrl}/.well-known/openid-configuration/${pathComponent}`);
    }

    // Standard well-known endpoints
    wellKnownUrls.push(`${baseUrl}/.well-known/oauth-authorization-server`);
    wellKnownUrls.push(`${baseUrl}/.well-known/openid-configuration`);

    // Try API subdomain variant (e.g., api.linear.app if authorization server is linear.app)
    // This handles cases where token endpoint is on different subdomain
    if (!baseUrl.includes('api.')) {
      const apiBaseUrl = baseUrl.replace(/^https?:\/\//, 'https://api.');
      wellKnownUrls.push(`${apiBaseUrl}/.well-known/oauth-authorization-server`);
      wellKnownUrls.push(`${apiBaseUrl}/.well-known/openid-configuration`);
    }

    // Try each well-known URI until one succeeds
    for (const wellKnownUrl of wellKnownUrls) {
      try {
        const response = await fetch(wellKnownUrl);
        if (response.ok) {
          const metadata = (await response.json()) as AuthorizationServerMetadata;
          if (metadata.authorization_endpoint && metadata.token_endpoint) {
            return metadata;
          }
        }
      } catch (_error) {}
    }

    throw new Error(
      `Failed to discover Authorization Server Metadata from well-known URIs for ${authorizationServerUrl}`
    );
  }

  /**
   * Discover OAuth configuration from resource metadata URL (from WWW-Authenticate header)
   */
  async discoverFromResourceMetadata(resourceMetadataUrl: string): Promise<OAuthDiscoveryResult> {
    // Fetch Protected Resource Metadata
    const resourceMetadataResponse = await fetch(resourceMetadataUrl);
    if (!resourceMetadataResponse.ok) {
      throw new Error(`Failed to fetch resource metadata: ${resourceMetadataResponse.status}`);
    }

    const resourceMetadata = (await resourceMetadataResponse.json()) as ProtectedResourceMetadata;

    return await this.discoverFromProtectedResourceMetadata(resourceMetadata);
  }

  /**
   * Perform Dynamic Client Registration
   */
  async registerClient(
    registrationEndpoint: string,
    redirectUri: string,
    scopes: string[]
  ): Promise<{ clientId: string; clientSecret?: string; registrationAccessToken?: string }> {
    const registrationRequest = {
      redirect_uris: [redirectUri],
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      scope: scopes.join(' '),
      token_endpoint_auth_method: 'none', // Public client (PKCE)
    };

    const response = await fetch(registrationEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(registrationRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Client registration failed: ${response.status} ${errorText}`);
    }

    const registrationData = (await response.json()) as {
      client_id: string;
      client_secret?: string;
      registration_access_token?: string;
    };

    return {
      clientId: registrationData.client_id,
      clientSecret: registrationData.client_secret,
      registrationAccessToken: registrationData.registration_access_token,
    };
  }
}
