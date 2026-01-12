/**
 * MCP Servers page
 */

import {
  Alert,
  AlertDescription,
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
    return <div className="p-6">Loading MCP servers...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900">MCP Servers</h2>
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
        <div className="grid grid-cols-1 gap-4">
          {servers.map((server) => (
            <Card key={server.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{server.name}</CardTitle>
                      {/* Connection status indicator */}
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          server.connectionStatus === 'connected'
                            ? 'bg-green-500'
                            : server.connectionStatus === 'error'
                              ? 'bg-red-500'
                              : 'bg-gray-400'
                        }`}
                        title={
                          server.connectionStatus === 'connected'
                            ? 'Connected'
                            : server.connectionStatus === 'error'
                              ? `Error: ${server.connectionError || 'Unknown error'}`
                              : 'Status unknown'
                        }
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Type: {server.type}
                      {server.type === 'builtin' && (
                        <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                          Built-in
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      {/* Tools count badge */}
                      <span className="text-xs px-2 py-1 bg-muted rounded">
                        {server.toolsCount ?? 0} tool{(server.toolsCount ?? 0) !== 1 ? 's' : ''}
                      </span>
                      {/* Connection status badge */}
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          server.connectionStatus === 'connected'
                            ? 'bg-green-100 text-green-800'
                            : server.connectionStatus === 'error'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {server.connectionStatus === 'connected'
                          ? 'Connected'
                          : server.connectionStatus === 'error'
                            ? 'Error'
                            : 'Unknown'}
                      </span>
                    </div>
                    {/* Validation details */}
                    {server.validationDetails && (
                      <p
                        className={`text-xs mt-2 ${
                          server.connectionStatus === 'connected'
                            ? 'text-green-700'
                            : server.connectionStatus === 'error'
                              ? 'text-red-700'
                              : 'text-gray-600'
                        }`}
                      >
                        {server.validationDetails}
                      </p>
                    )}
                    {server.oauthConfig && (
                      <div className="mt-4">
                        <p className="text-sm font-medium">OAuth Configuration</p>
                        <p className="text-xs text-muted-foreground">
                          Authorization Server: {server.oauthConfig.authorizationServerUrl}
                        </p>
                        <Button
                          size="sm"
                          onClick={() => handleOAuthAuthorize(server.id)}
                          className="mt-2"
                        >
                          Authorize
                        </Button>
                      </div>
                    )}
                    {server.apiKeyConfig &&
                      (() => {
                        const parsed = parseApiKeyConfig(server.apiKeyConfig);
                        return parsed ? (
                          <div className="mt-4">
                            <p className="text-sm font-medium">API Key Configured</p>
                            <p className="text-xs text-muted-foreground">
                              Header: {parsed.headerName}
                            </p>
                          </div>
                        ) : null;
                      })()}
                    {server.type === 'builtin' &&
                      server.metadata?.requiresApiKey &&
                      !server.apiKeyConfig && (
                        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                          <p className="text-sm font-medium text-amber-800">API Key Required</p>
                          <p className="text-xs text-amber-700">
                            {server.metadata.apiKeyHint ||
                              'This built-in server requires an API key to function. Click Edit to configure.'}
                          </p>
                        </div>
                      )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/mcp-servers/${server.id}`)}
                      aria-label={`View details for ${server.name}`}
                    >
                      View Details
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
