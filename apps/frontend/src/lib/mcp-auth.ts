import { getFullMcpEndpointUrl } from '../config/api';

const LOGIN_PATHS = new Set(['/login', '/sign-in']);
const REQUIRED_OIDC_PARAMS = ['client_id', 'redirect_uri', 'response_type'];

export function isMcpLoginPath(pathname: string): boolean {
  return LOGIN_PATHS.has(pathname);
}

export function hasMcpAuthQuery(search: string): boolean {
  const params = new URLSearchParams(search);
  return REQUIRED_OIDC_PARAMS.every((key) => params.has(key));
}

export function getMcpAuthorizeUrl(search: string): string {
  return `${getFullMcpEndpointUrl()}/api/auth/mcp/authorize${search}`;
}
