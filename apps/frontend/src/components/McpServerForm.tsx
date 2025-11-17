/**
 * MCP Server Form Component
 *
 * Form for creating and editing MCP servers
 */

import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@local-mcp/ui';
import { useEffect, useState } from 'react';

interface McpServer {
  id: string;
  name: string;
  type: 'external' | 'custom' | 'remote_http' | 'remote_sse';
  config: Record<string, unknown>;
  oauthConfig?: {
    authorizationServerUrl: string;
    tokenEndpoint?: string;
    resource?: string;
    scopes: string[];
    requiresOAuth: boolean;
    callbackUrl?: string;
    clientId?: string;
    clientSecret?: string;
  };
  apiKeyConfig?: {
    apiKey: string;
    headerName: string;
    headerValue: string;
  };
  createdAt: number;
  updatedAt: number;
}

interface McpServerFormProps {
  server?: McpServer | null;
  onSave: (data: {
    name: string;
    type: 'remote_http' | 'remote_sse';
    config: { url: string; transport: 'http' | 'sse' };
    oauthConfig?: {
      authorizationServerUrl: string;
      tokenEndpoint?: string;
      resource?: string;
      scopes: string[];
      requiresOAuth: boolean;
      callbackUrl?: string;
      clientId?: string;
      clientSecret?: string;
    };
    apiKeyConfig?: {
      apiKey: string;
      headerName: string;
      headerValue: string;
    };
  }) => Promise<void>;
  onCancel: () => void;
  isOpen: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function McpServerForm({
  server,
  onSave,
  onCancel,
  isOpen,
  onOpenChange,
}: McpServerFormProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'remote_http' | 'remote_sse'>('remote_http');
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Authentication type: 'none' | 'oauth' | 'api_key'
  const [authType, setAuthType] = useState<'none' | 'oauth' | 'api_key'>('none');

  // OAuth config
  const [oauthAuthUrl, setOauthAuthUrl] = useState('');
  const [oauthTokenEndpoint, setOauthTokenEndpoint] = useState('');
  const [oauthResource, setOauthResource] = useState('');
  const [oauthScopes, setOauthScopes] = useState('');
  const [oauthClientId, setOauthClientId] = useState('');
  const [oauthClientSecret, setOauthClientSecret] = useState('');
  const [oauthCallbackUrl, setOauthCallbackUrl] = useState('');

  // API key config
  const [apiKey, setApiKey] = useState('');
  const [apiKeyHeaderName, setApiKeyHeaderName] = useState('Authorization');
  const [apiKeyHeaderValue, setApiKeyHeaderValue] = useState('Bearer {apiKey}');

  useEffect(() => {
    if (server) {
      setName(server.name);
      setType(
        server.type === 'remote_http' || server.type === 'remote_sse' ? server.type : 'remote_http'
      );
      const config = server.config as { url?: string };
      setUrl(config.url || '');

      if (server.oauthConfig) {
        setAuthType('oauth');
        setOauthAuthUrl(server.oauthConfig.authorizationServerUrl);
        setOauthTokenEndpoint(server.oauthConfig.tokenEndpoint || '');
        setOauthResource(server.oauthConfig.resource || '');
        setOauthScopes(server.oauthConfig.scopes.join(' '));
        setOauthClientId(server.oauthConfig.clientId || '');
        setOauthClientSecret(server.oauthConfig.clientSecret || '');
        setOauthCallbackUrl(server.oauthConfig.callbackUrl || '');
      } else if (server.apiKeyConfig) {
        setAuthType('api_key');
        setApiKey(server.apiKeyConfig.apiKey);
        setApiKeyHeaderName(server.apiKeyConfig.headerName);
        setApiKeyHeaderValue(server.apiKeyConfig.headerValue);
      } else {
        setAuthType('none');
      }
    } else {
      // Reset form
      setName('');
      setType('remote_http');
      setUrl('');
      setAuthType('none');
      setOauthAuthUrl('');
      setOauthTokenEndpoint('');
      setOauthResource('');
      setOauthScopes('');
      setOauthClientId('');
      setOauthClientSecret('');
      setOauthCallbackUrl('');
      setApiKey('');
      setApiKeyHeaderName('Authorization');
      setApiKeyHeaderValue('Bearer {apiKey}');
    }
    setError(null);
  }, [server]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (!url.trim()) {
      setError('URL is required');
      return;
    }

    try {
      new URL(url);
    } catch {
      setError('Invalid URL format');
      return;
    }

    if (authType === 'oauth' && !oauthAuthUrl.trim()) {
      setError('OAuth authorization server URL is required when OAuth is enabled');
      return;
    }

    if (authType === 'oauth' && oauthScopes.trim() && !oauthClientId.trim()) {
      setError('OAuth Client ID is required when OAuth is enabled');
      return;
    }

    if (authType === 'api_key' && !apiKey.trim()) {
      setError('API key is required when API key authentication is enabled');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        name: name.trim(),
        type,
        config: {
          url: url.trim(),
          transport: type === 'remote_http' ? 'http' : 'sse',
        },
        oauthConfig:
          authType === 'oauth'
            ? {
                authorizationServerUrl: oauthAuthUrl.trim(),
                tokenEndpoint: oauthTokenEndpoint.trim() || undefined,
                resource: oauthResource.trim() || undefined,
                scopes: oauthScopes.trim().split(/\s+/).filter(Boolean),
                requiresOAuth: true,
                callbackUrl: oauthCallbackUrl.trim() || undefined,
                clientId: oauthClientId.trim() || undefined,
                clientSecret: oauthClientSecret.trim() || undefined,
              }
            : undefined,
        apiKeyConfig:
          authType === 'api_key'
            ? {
                apiKey: apiKey.trim(),
                headerName: apiKeyHeaderName.trim(),
                headerValue: apiKeyHeaderValue.trim(),
              }
            : undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save MCP server');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open: boolean) => {
        if (onOpenChange) {
          onOpenChange(open);
        }
        if (!open) {
          onCancel();
        }
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{server ? 'Edit MCP Server' : 'Add MCP Server'}</DialogTitle>
          <DialogDescription>
            {server
              ? 'Update MCP server configuration below.'
              : 'Add a new MCP server to connect to external services.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="server-name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="server-name"
                type="text"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="server-type">
                Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={type}
                onValueChange={(value: string) => setType(value as 'remote_http' | 'remote_sse')}
                disabled={isSubmitting}
              >
                <SelectTrigger id="server-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="remote_http">Remote HTTP</SelectItem>
                  <SelectItem value="remote_sse">Remote SSE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="server-url">
              URL <span className="text-red-500">*</span>
            </Label>
            <Input
              id="server-url"
              type="url"
              value={url}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
              placeholder="https://example.com/mcp"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Authentication Type Selection */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Authentication</Label>
            <RadioGroup
              value={authType}
              onValueChange={(value) => setAuthType(value as 'none' | 'oauth' | 'api_key')}
              disabled={isSubmitting}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="none" id="auth-none" />
                <Label htmlFor="auth-none" className="font-normal cursor-pointer">
                  None
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="oauth" id="auth-oauth" />
                <Label htmlFor="auth-oauth" className="font-normal cursor-pointer">
                  OAuth Authentication
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="api_key" id="auth-api-key" />
                <Label htmlFor="auth-api-key" className="font-normal cursor-pointer">
                  API Key Authentication
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* OAuth Configuration */}
          {authType === 'oauth' && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="oauth-auth-url" className="text-xs">
                      Authorization Server URL <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="oauth-auth-url"
                      type="url"
                      value={oauthAuthUrl}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setOauthAuthUrl(e.target.value)
                      }
                      required={authType === 'oauth'}
                      disabled={isSubmitting}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="oauth-token-endpoint" className="text-xs">
                      Token Endpoint (optional)
                    </Label>
                    <Input
                      id="oauth-token-endpoint"
                      type="url"
                      value={oauthTokenEndpoint}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setOauthTokenEndpoint(e.target.value)
                      }
                      disabled={isSubmitting}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="oauth-client-id" className="text-xs">
                      Client ID <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="oauth-client-id"
                      type="text"
                      value={oauthClientId}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setOauthClientId(e.target.value)
                      }
                      required={authType === 'oauth'}
                      disabled={isSubmitting}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="oauth-client-secret" className="text-xs">
                      Client Secret (optional, for confidential clients)
                    </Label>
                    <Input
                      id="oauth-client-secret"
                      type="password"
                      value={oauthClientSecret}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setOauthClientSecret(e.target.value)
                      }
                      disabled={isSubmitting}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="oauth-scopes" className="text-xs">
                      Scopes (space-separated)
                    </Label>
                    <Input
                      id="oauth-scopes"
                      type="text"
                      value={oauthScopes}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setOauthScopes(e.target.value)
                      }
                      placeholder="read write"
                      disabled={isSubmitting}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="oauth-resource" className="text-xs">
                      Resource (optional, RFC 8707)
                    </Label>
                    <Input
                      id="oauth-resource"
                      type="url"
                      value={oauthResource}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setOauthResource(e.target.value)
                      }
                      disabled={isSubmitting}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="oauth-callback-url" className="text-xs">
                      Callback URL (optional)
                    </Label>
                    <Input
                      id="oauth-callback-url"
                      type="url"
                      value={oauthCallbackUrl}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setOauthCallbackUrl(e.target.value)
                      }
                      disabled={isSubmitting}
                      className="text-sm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* API Key Configuration */}
          {authType === 'api_key' && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="api-key" className="text-xs">
                      API Key <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="api-key"
                      type="password"
                      value={apiKey}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setApiKey(e.target.value)
                      }
                      required={authType === 'api_key'}
                      disabled={isSubmitting}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="api-key-header-name" className="text-xs">
                      Header Name <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={apiKeyHeaderName}
                      onValueChange={setApiKeyHeaderName}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id="api-key-header-name" className="text-sm">
                        <SelectValue placeholder="Select header name" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Authorization">Authorization</SelectItem>
                        <SelectItem value="X-API-Key">X-API-Key</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="api-key-header-value" className="text-xs">
                      Header Value Template <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="api-key-header-value"
                      type="text"
                      value={apiKeyHeaderValue}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setApiKeyHeaderValue(e.target.value)
                      }
                      placeholder="Bearer {apiKey} or {apiKey}"
                      required={authType === 'api_key'}
                      disabled={isSubmitting}
                      className="text-sm"
                    />
                    <p className="text-xs text-muted-foreground">Use {'{apiKey}'} as placeholder</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : server ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
