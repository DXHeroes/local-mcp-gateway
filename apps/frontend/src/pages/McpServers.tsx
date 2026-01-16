/**
 * MCP Servers page
 */

import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
} from '@dxheroes/local-mcp-ui';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import McpServerForm, { type McpServerFormData } from '../components/McpServerForm';

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

interface McpServerWithStatus extends McpServer {
  toolsCount?: number;
  connectionStatus?: 'connected' | 'error' | 'unknown';
  connectionError?: string;
  validationDetails?: string;
  validatedAt?: string;
}

import { API_URL } from '../config/api';

// Helper to parse apiKeyConfig which may be a JSON string from the database
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

export default function McpServersPage() {
  const navigate = useNavigate();
  const [servers, setServers] = useState<McpServerWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<McpServer | null>(null);

  const fetchServers = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const response = await fetch(`${API_URL}/api/mcp-servers`);
      if (!response.ok) {
        throw new Error('Failed to fetch MCP servers');
      }
      const data: McpServer[] = await response.json();

      // Fetch tools count and status for each server
      const serversWithStatus = await Promise.all(
        data.map(async (server) => {
          let toolsCount = 0;
          let connectionStatus: 'connected' | 'error' | 'unknown' = 'unknown';
          let connectionError: string | undefined;

          let validationDetails: string | undefined;
          let validatedAt: string | undefined;

          try {
            // Fetch tools
            const toolsResponse = await fetch(`${API_URL}/api/mcp-servers/${server.id}/tools`);
            if (toolsResponse.ok) {
              const toolsData = await toolsResponse.json();
              toolsCount = Array.isArray(toolsData.tools) ? toolsData.tools.length : 0;
            }

            // Fetch status (now includes real API validation)
            const statusResponse = await fetch(`${API_URL}/api/mcp-servers/${server.id}/status`);
            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              connectionStatus = statusData.status || 'unknown';
              connectionError = statusData.error || undefined;
              validationDetails = statusData.details || undefined;
              validatedAt = statusData.validatedAt || undefined;
            }
          } catch {
            // Ignore errors when fetching status/tools - server might be unavailable
            connectionStatus = 'unknown';
          }

          return {
            ...server,
            toolsCount,
            connectionStatus,
            connectionError,
            validationDetails,
            validatedAt,
          };
        })
      );

      setServers(serversWithStatus);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  const handleCreate = async (data: McpServerFormData) => {
    const response = await fetch(`${API_URL}/api/mcp-servers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create MCP server');
    }

    setIsFormOpen(false);
    await fetchServers(true);
  };

  const handleUpdate = async (data: McpServerFormData) => {
    if (!editingServer) return;

    const response = await fetch(`${API_URL}/api/mcp-servers/${editingServer.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update MCP server');
    }

    setIsFormOpen(false);
    setEditingServer(null);
    await fetchServers(true);
  };

  const handleDelete = async (serverId: string) => {
    if (!confirm('Are you sure you want to delete this MCP server?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/mcp-servers/${serverId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete MCP server');
      }

      await fetchServers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete MCP server');
    }
  };

  const handleOAuthAuthorize = async (serverId: string) => {
    window.open(`${API_URL}/api/oauth/authorize/${serverId}`, '_blank', 'width=600,height=700');

    // Listen for OAuth callback message
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'oauth-callback' && event.data.success) {
        window.removeEventListener('message', handleMessage);
        fetchServers(); // Refresh servers list
        alert('OAuth authorization successful!');
      } else if (event.data.type === 'oauth-callback' && !event.data.success) {
        window.removeEventListener('message', handleMessage);
        setError(event.data.error || 'OAuth authorization failed');
      }
    };
    window.addEventListener('message', handleMessage);
  };

  const openCreateForm = () => {
    setEditingServer(null);
    setIsFormOpen(true);
  };

  const openEditForm = (server: McpServer) => {
    setEditingServer(server);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingServer(null);
  };

  if (loading) {
    return <div className="p-4">Loading MCP servers...</div>;
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-gray-900">MCP Servers</h2>
          {refreshing && (
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
              Refreshing...
            </span>
          )}
        </div>
        <Button onClick={openCreateForm}>Add MCP Server</Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>Error: {error}</AlertDescription>
        </Alert>
      )}

      {!error && servers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">
            No MCP servers found. Create your first MCP server to get started.
          </p>
          <Button onClick={openCreateForm}>Add MCP Server</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {servers.map((server) => (
            <Card key={server.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{server.name}</CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/mcp-servers/${server.id}`)}
                          aria-label={`View details for ${server.name}`}
                        >
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditForm(server)}
                          aria-label={`Edit ${server.name}`}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(server.id)}
                          aria-label={`Delete ${server.name}`}
                          className="text-destructive hover:text-destructive"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {/* Type badge */}
                      <Badge variant={server.type === 'builtin' ? 'default' : 'secondary'}>
                        {server.type}
                      </Badge>
                      {/* Tools count badge */}
                      <Badge variant="outline">
                        {server.toolsCount ?? 0} tool{(server.toolsCount ?? 0) !== 1 ? 's' : ''}
                      </Badge>
                      {/* Connection status badge */}
                      <Badge
                        variant={
                          server.connectionStatus === 'connected'
                            ? 'success'
                            : server.connectionStatus === 'error'
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {server.connectionStatus === 'connected'
                          ? 'Connected'
                          : server.connectionStatus === 'error'
                            ? 'Error'
                            : 'Unknown'}
                      </Badge>
                    </div>
                    {/* Validation error alert */}
                    {server.connectionStatus === 'error' && server.connectionError && (
                      <Alert variant="destructive" className="mt-3 py-2">
                        <AlertDescription className="text-xs">
                          {server.connectionError}
                        </AlertDescription>
                      </Alert>
                    )}
                    {/* Validation details for connected servers */}
                    {server.connectionStatus === 'connected' && server.validationDetails && (
                      <p className="text-xs mt-2 text-green-700">{server.validationDetails}</p>
                    )}
                    {/* API Key warning for builtin servers */}
                    {server.type === 'builtin' &&
                      server.metadata?.requiresApiKey &&
                      !server.apiKeyConfig && (
                        <Alert variant="default" className="mt-3 py-2 border-amber-200 bg-amber-50">
                          <AlertDescription className="text-xs text-amber-800">
                            <span className="font-medium">API Key Required:</span>{' '}
                            {server.metadata.apiKeyHint ||
                              'This built-in server requires an API key to function. Click Edit to configure.'}
                          </AlertDescription>
                        </Alert>
                      )}
                    {/* OAuth configuration */}
                    {server.oauthConfig && (
                      <div className="mt-3 flex items-center gap-2">
                        <Badge variant="outline">OAuth</Badge>
                        <span className="text-xs text-muted-foreground truncate max-w-xs">
                          {server.oauthConfig.authorizationServerUrl}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOAuthAuthorize(server.id)}
                        >
                          Authorize
                        </Button>
                      </div>
                    )}
                    {/* API Key configured */}
                    {server.apiKeyConfig &&
                      (() => {
                        const parsed = parseApiKeyConfig(server.apiKeyConfig);
                        return parsed ? (
                          <div className="mt-3 flex items-center gap-2">
                            <Badge variant="outline">API Key</Badge>
                            <span className="text-xs text-muted-foreground">
                              Header: {parsed.headerName}
                            </span>
                          </div>
                        ) : null;
                      })()}
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <McpServerForm
        server={editingServer}
        onSave={editingServer ? handleUpdate : handleCreate}
        onCancel={closeForm}
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
      />
    </div>
  );
}
