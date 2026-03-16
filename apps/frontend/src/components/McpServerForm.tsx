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
} from '@dxheroes/local-mcp-ui';
import { Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface McpServerMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  requiresApiKey: boolean;
  apiKeyHint?: string;
  apiKeyDefaults?: {
    headerName: string;
    headerValueTemplate: string;
  };
  requiresOAuth?: boolean;
  oauthDefaults?: {
    scopes: string[];
    authorizationServerUrl?: string;
  };
  icon?: string;
  docsUrl?: string;
}

interface McpServer {
  id: string;
  name: string;
  type: 'external' | 'custom' | 'remote_http' | 'remote_sse' | 'builtin';
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
  metadata?: McpServerMetadata;
  createdAt: number;
  updatedAt: number;
}

type RemoteServerFormData = {
  name: string;
  type: 'remote_http' | 'remote_sse';
  config: { url: string; transport: 'http' | 'sse'; headers?: Record<string, string> };
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
};

type BuiltinServerFormData = {
  name: string;
  type: 'builtin';
  config: Record<string, unknown>;
  apiKeyConfig?: {
    apiKey: string;
    headerName: string;
    headerValue: string;
  };
};

type ExternalServerFormData = {
  name: string;
  type: 'external';
  config: {
    command: string;
    args?: string[];
    env?: Record<string, string>;
    workingDirectory?: string;
    autoRestart?: boolean;
  };
};

export type McpServerFormData =
  | RemoteServerFormData
  | BuiltinServerFormData
  | ExternalServerFormData;

// Helper to parse apiKeyConfig (can be string or object)
const parseApiKeyConfig = (
  config: unknown
): { apiKey: string; headerName: string; headerValue: string } | null => {
  if (!config) return null;
  if (typeof config === 'string') {
    try {
      return JSON.parse(config);
    } catch {
      return null;
    }
  }
  return config as { apiKey: string; headerName: string; headerValue: string };
};

// Helper to parse config (can be string or object)
const parseConfig = (config: unknown): Record<string, unknown> => {
  if (!config) return {};
  if (typeof config === 'string') {
    try {
      return JSON.parse(config);
    } catch {
      return {};
    }
  }
  return config as Record<string, unknown>;
};

interface PresetData {
  id: string;
  name: string;
  type: string;
  config: Record<string, unknown>;
  requiresApiKey?: boolean;
  apiKeyDefaults?: {
    headerName: string;
    headerValueTemplate: string;
  };
}

interface McpServerFormProps {
  server?: McpServer | null;
  presetData?: PresetData | null;
  onSave: (data: McpServerFormData) => Promise<void>;
  onCancel: () => void;
  isOpen: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function McpServerForm({
  server,
  presetData,
  onSave,
  onCancel,
  isOpen,
  onOpenChange,
}: McpServerFormProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'remote_http' | 'remote_sse' | 'external'>('remote_http');
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // External server config
  const [command, setCommand] = useState('');
  const [args, setArgs] = useState('');
  const [envVars, setEnvVars] = useState('');
  const [workingDirectory, setWorkingDirectory] = useState('');
  const [autoRestart, setAutoRestart] = useState(true);

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
  const [showApiKey, setShowApiKey] = useState(false);

  // Custom headers (key-value pairs for remote servers)
  const [customHeaders, setCustomHeaders] = useState<Array<{ key: string; value: string }>>([]);

  // Ref for focusing API key input
  const apiKeyInputRef = useRef<HTMLInputElement>(null);

  // Derived state for builtin servers
  const isBuiltin = server?.type === 'builtin';
  const metadata = server?.metadata;

  useEffect(() => {
    if (server) {
      setName(server.name);

      // Handle builtin servers differently
      if (server.type === 'builtin') {
        // For builtin, use metadata defaults for API key config
        if (server.metadata?.requiresApiKey) {
          setAuthType('api_key');
          const defaults = server.metadata.apiKeyDefaults;
          if (defaults) {
            setApiKeyHeaderName(defaults.headerName);
            setApiKeyHeaderValue(defaults.headerValueTemplate);
          }
          // If API key already configured, load it
          const parsedApiKeyConfig = parseApiKeyConfig(server.apiKeyConfig);
          if (parsedApiKeyConfig) {
            setApiKey(parsedApiKeyConfig.apiKey);
          } else {
            setApiKey('');
          }
        } else {
          setAuthType('none');
        }
        // Builtin servers don't have URL or type selection
        setUrl('');
        setType('remote_http'); // Default, but not used
      } else if (server.type === 'external') {
        // Handle external servers
        setType('external');
        const config = parseConfig(server.config) as {
          command?: string;
          args?: string[];
          env?: Record<string, string>;
          workingDirectory?: string;
          autoRestart?: boolean;
        };
        setCommand(config.command || '');
        setArgs(config.args?.join(' ') || '');
        setEnvVars(
          config.env
            ? Object.entries(config.env)
                .map(([k, v]) => `${k}=${v}`)
                .join('\n')
            : ''
        );
        setWorkingDirectory(config.workingDirectory || '');
        setAutoRestart(config.autoRestart ?? true);
        setAuthType('none');
        setUrl('');
      } else {
        // Handle remote servers
        setType(
          server.type === 'remote_http' || server.type === 'remote_sse'
            ? server.type
            : 'remote_http'
        );
        const config = parseConfig(server.config) as { url?: string; headers?: Record<string, string> };
        setUrl(config.url || '');

        // Load custom headers from config
        if (config.headers && Object.keys(config.headers).length > 0) {
          setCustomHeaders(
            Object.entries(config.headers).map(([key, value]) => ({ key, value }))
          );
        } else {
          setCustomHeaders([]);
        }

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
          const parsedApiKeyConfig = parseApiKeyConfig(server.apiKeyConfig);
          if (parsedApiKeyConfig) {
            setAuthType('api_key');
            setApiKey(parsedApiKeyConfig.apiKey);
            setApiKeyHeaderName(parsedApiKeyConfig.headerName);
            setApiKeyHeaderValue(parsedApiKeyConfig.headerValue);
          }
        } else {
          setAuthType('none');
        }
      }
    } else if (presetData) {
      // Pre-fill from preset data (create mode with preset)
      setName(presetData.name);
      setType(
        presetData.type === 'remote_http' || presetData.type === 'remote_sse'
          ? presetData.type
          : presetData.type === 'external'
            ? 'external'
            : 'remote_http'
      );
      const config = presetData.config as { url?: string; headers?: Record<string, string> };
      setUrl(config.url || '');
      if (config.headers && Object.keys(config.headers).length > 0) {
        setCustomHeaders(
          Object.entries(config.headers).map(([key, value]) => ({ key, value }))
        );
      } else {
        setCustomHeaders([]);
      }
      if (presetData.requiresApiKey && presetData.apiKeyDefaults) {
        setAuthType('api_key');
        setApiKeyHeaderName(presetData.apiKeyDefaults.headerName);
        setApiKeyHeaderValue(presetData.apiKeyDefaults.headerValueTemplate);
      } else {
        setAuthType('none');
      }
      setApiKey('');
      setOauthAuthUrl('');
      setOauthTokenEndpoint('');
      setOauthResource('');
      setOauthScopes('');
      setOauthClientId('');
      setOauthClientSecret('');
      setOauthCallbackUrl('');
      setCommand('');
      setArgs('');
      setEnvVars('');
      setWorkingDirectory('');
      setAutoRestart(true);
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
      // Reset external server fields
      setCommand('');
      setArgs('');
      setEnvVars('');
      setWorkingDirectory('');
      setAutoRestart(true);
      setCustomHeaders([]);
    }
    setShowApiKey(false);
    setError(null);
  }, [server, presetData, isOpen]);

  // Focus API key input for builtin servers that require it, or preset with requiresApiKey
  useEffect(() => {
    const shouldFocus =
      (isOpen && server?.type === 'builtin' && server.metadata?.requiresApiKey) ||
      (isOpen && !server && presetData?.requiresApiKey);
    if (shouldFocus) {
      // Small delay to ensure dialog is rendered
      setTimeout(() => {
        apiKeyInputRef.current?.focus();
      }, 0);
    }
  }, [isOpen, server, presetData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    // Builtin server validation and submission
    if (isBuiltin && server) {
      // For builtin servers requiring API key
      if (metadata?.requiresApiKey && !apiKey.trim()) {
        setError('API key is required');
        return;
      }

      try {
        setIsSubmitting(true);
        await onSave({
          name: name.trim(),
          type: 'builtin',
          config: server.config, // Preserve original config with builtinId
          apiKeyConfig: metadata?.requiresApiKey
            ? {
                apiKey: apiKey.trim(),
                headerName: apiKeyHeaderName.trim(),
                headerValue: apiKeyHeaderValue.trim().replace('{apiKey}', apiKey.trim()),
              }
            : undefined,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save MCP server');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // External server validation and submission
    if (type === 'external') {
      if (!command.trim()) {
        setError('Command is required for external MCP servers');
        return;
      }

      // Parse args (space-separated)
      const parsedArgs = args.trim() ? args.trim().split(/\s+/) : undefined;

      // Parse env vars (KEY=VALUE per line)
      let parsedEnv: Record<string, string> | undefined;
      if (envVars.trim()) {
        parsedEnv = {};
        const lines = envVars.trim().split('\n');
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || trimmedLine.startsWith('#')) continue;
          const eqIndex = trimmedLine.indexOf('=');
          if (eqIndex === -1) {
            setError(`Invalid environment variable format: ${trimmedLine}`);
            return;
          }
          const key = trimmedLine.substring(0, eqIndex).trim();
          const value = trimmedLine.substring(eqIndex + 1);
          if (!key) {
            setError(`Invalid environment variable key: ${trimmedLine}`);
            return;
          }
          parsedEnv[key] = value;
        }
      }

      try {
        setIsSubmitting(true);
        await onSave({
          name: name.trim(),
          type: 'external',
          config: {
            command: command.trim(),
            args: parsedArgs,
            env: parsedEnv,
            workingDirectory: workingDirectory.trim() || undefined,
            autoRestart,
          },
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save MCP server');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Remote server validation
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
      // Build custom headers record (filter out empty keys)
      const headersRecord: Record<string, string> = {};
      for (const h of customHeaders) {
        const k = h.key.trim();
        if (k) {
          headersRecord[k] = h.value;
        }
      }

      await onSave({
        name: name.trim(),
        type,
        config: {
          url: url.trim(),
          transport: type === 'remote_http' ? 'http' : 'sse',
          ...(Object.keys(headersRecord).length > 0 ? { headers: headersRecord } : {}),
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

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Name field - shown for all servers */}
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

          {/* Builtin server info card */}
          {isBuiltin && metadata && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{metadata.icon || '📦'}</span>
                  <div className="flex-1">
                    <p className="font-medium text-blue-900">Built-in MCP Server</p>
                    <p className="text-sm text-blue-700 mt-1">{metadata.description}</p>
                    {metadata.docsUrl && (
                      <a
                        href={metadata.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline mt-2 inline-block"
                      >
                        View documentation
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Type selection - only for new servers */}
          {!isBuiltin && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="server-type">
                    Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={type}
                    onValueChange={(value: string) =>
                      setType(value as 'remote_http' | 'remote_sse' | 'external')
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="server-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="remote_http">Remote HTTP</SelectItem>
                      <SelectItem value="remote_sse">Remote SSE</SelectItem>
                      <SelectItem value="external">External (NPX/Stdio)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* External server fields */}
              {type === 'external' && (
                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="pt-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="server-command" className="text-sm">
                        Command <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="server-command"
                        type="text"
                        value={command}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCommand(e.target.value)
                        }
                        placeholder="npx"
                        required
                        disabled={isSubmitting}
                      />
                      <p className="text-xs text-muted-foreground">
                        The command to run (e.g., npx, node, python)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="server-args" className="text-sm">
                        Arguments
                      </Label>
                      <Input
                        id="server-args"
                        type="text"
                        value={args}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setArgs(e.target.value)
                        }
                        placeholder="-y @playwright/mcp"
                        disabled={isSubmitting}
                      />
                      <p className="text-xs text-muted-foreground">
                        Space-separated arguments (e.g., -y @playwright/mcp)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="server-env" className="text-sm">
                        Environment Variables
                      </Label>
                      <textarea
                        id="server-env"
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={envVars}
                        onChange={(e) => setEnvVars(e.target.value)}
                        placeholder="API_KEY=your_key&#10;DEBUG=true"
                        disabled={isSubmitting}
                      />
                      <p className="text-xs text-muted-foreground">
                        One per line: KEY=VALUE format. Lines starting with # are ignored.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="server-cwd" className="text-sm">
                        Working Directory
                      </Label>
                      <Input
                        id="server-cwd"
                        type="text"
                        value={workingDirectory}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setWorkingDirectory(e.target.value)
                        }
                        placeholder="/path/to/directory (optional)"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="auto-restart"
                        checked={autoRestart}
                        onChange={(e) => setAutoRestart(e.target.checked)}
                        disabled={isSubmitting}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <Label htmlFor="auto-restart" className="text-sm font-normal cursor-pointer">
                        Auto-restart on crash
                      </Label>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* URL field - only for remote servers */}
              {type !== 'external' && (
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
              )}

              {/* Authentication Type Selection - only for remote servers (not external) */}
              {type !== 'external' && (
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
              )}
            </>
          )}

          {/* OAuth Configuration - only for remote servers */}
          {!isBuiltin && type !== 'external' && authType === 'oauth' && (
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

          {/* API Key Configuration - for builtin servers requiring API key */}
          {isBuiltin && metadata?.requiresApiKey && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="api-key" className="text-xs">
                      API Key <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        ref={apiKeyInputRef}
                        id="api-key"
                        type={showApiKey ? 'text' : 'password'}
                        value={apiKey}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setApiKey(e.target.value)
                        }
                        required
                        disabled={isSubmitting}
                        className="text-sm pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
                      >
                        {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  {metadata.apiKeyHint && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                      <p className="text-xs text-amber-800">{metadata.apiKeyHint}</p>
                    </div>
                  )}
                  {metadata.apiKeyDefaults && (
                    <div className="text-xs text-muted-foreground">
                      <p>
                        Header:{' '}
                        <code className="bg-muted px-1 rounded">
                          {metadata.apiKeyDefaults.headerName}
                        </code>
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Custom Headers - for remote servers (not external, not builtin) */}
          {!isBuiltin && type !== 'external' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Custom Headers</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCustomHeaders([...customHeaders, { key: '', value: '' }])}
                  disabled={isSubmitting}
                >
                  <Plus size={14} className="mr-1" />
                  Add Header
                </Button>
              </div>
              {customHeaders.length > 0 && (
                <Card>
                  <CardContent className="pt-4 space-y-3">
                    {customHeaders.map((header, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          type="text"
                          value={header.key}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const updated = [...customHeaders];
                            updated[index] = { key: e.target.value, value: header.value };
                            setCustomHeaders(updated);
                          }}
                          placeholder="Header name"
                          disabled={isSubmitting}
                          className="text-sm flex-1"
                        />
                        <Input
                          type="text"
                          value={header.value}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const updated = [...customHeaders];
                            updated[index] = { key: header.key, value: e.target.value };
                            setCustomHeaders(updated);
                          }}
                          placeholder="Header value"
                          disabled={isSubmitting}
                          className="text-sm flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCustomHeaders(customHeaders.filter((_, i) => i !== index));
                          }}
                          disabled={isSubmitting}
                          className="text-muted-foreground hover:text-destructive px-2"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground">
                      Custom headers are sent with every request. Auth headers override custom headers
                      with the same name.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* API Key Configuration - for remote servers (not external) */}
          {!isBuiltin && type !== 'external' && authType === 'api_key' && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="api-key" className="text-xs">
                      API Key <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      ref={apiKeyInputRef}
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
