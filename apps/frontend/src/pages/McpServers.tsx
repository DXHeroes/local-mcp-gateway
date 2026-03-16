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
import McpPresetGallery, { type PresetData } from '../components/McpPresetGallery';
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
  userId?: string;
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
  enabledToolsCount?: number;
  connectionStatus?: 'connected' | 'error' | 'unknown';
  connectionError?: string;
  validationDetails?: string;
  validatedAt?: string;
  oauthRequired?: boolean;
}

import { API_URL } from '../config/api';
import { useSharingSummary } from '../hooks/useSharingSummary';
import { apiFetch } from '../lib/api-fetch';
import { authClient } from '../lib/auth-client';

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
  const { data: session } = authClient.useSession();
  const { summary: sharingSummary } = useSharingSummary('mcp_server');
  const [servers, setServers] = useState<McpServerWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<McpServer | null>(null);
  const [presetData, setPresetData] = useState<PresetData | null>(null);

  const fetchServers = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const response = await apiFetch('/api/mcp-servers');
      if (!response.ok) {
        throw new Error('Failed to fetch MCP servers');
      }
      const data: McpServer[] = await response.json();

      // Stage 1: Show servers immediately with undefined status
      setServers(data.map((server) => ({ ...server })));
      setError(null);
      setLoading(false);

      // Stage 2: Fetch per-server status in parallel (each updates UI as it resolves)
      const updateServerStatus = async (server: McpServer) => {
        const statusRes = await apiFetch(`/api/mcp-servers/${server.id}/status`);
        if (!statusRes.ok) return;
        const status = (await statusRes.json()) as {
          status?: string;
          toolsCount?: number;
          enabledToolsCount?: number;
          error?: string;
          details?: string;
          validatedAt?: string;
          oauthRequired?: boolean;
        };
        setServers((prev) =>
          prev.map((s) =>
            s.id === server.id
              ? {
                  ...s,
                  connectionStatus:
                    (status.status as 'connected' | 'error' | 'unknown') || 'unknown',
                  toolsCount: status.toolsCount,
                  enabledToolsCount: status.enabledToolsCount,
                  connectionError: status.error || undefined,
                  validationDetails: status.details || undefined,
                  validatedAt: status.validatedAt || undefined,
                  oauthRequired: !!status.oauthRequired,
                }
              : s
          )
        );
      };

      await Promise.allSettled(data.map((server) => updateServerStatus(server)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  const handleCreate = async (data: McpServerFormData) => {
    const response = await apiFetch('/api/mcp-servers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create MCP server');
    }

    setIsFormOpen(false);
    setPresetData(null);
    await fetchServers(true);
  };

  const handleUpdate = async (data: McpServerFormData) => {
    if (!editingServer) return;

    const response = await apiFetch(`/api/mcp-servers/${editingServer.id}`, {
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
      const response = await apiFetch(`/api/mcp-servers/${serverId}`, {
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
    const handleMessage = async (event: MessageEvent) => {
      if (event.data.type === 'oauth-callback' && event.data.success) {
        window.removeEventListener('message', handleMessage);
        // Refresh only this server's status (bypasses batch cache)
        try {
          const statusRes = await apiFetch(`/api/mcp-servers/${serverId}/status`);
          if (statusRes.ok) {
            const status = await statusRes.json();
            setServers((prev) =>
              prev.map((s) =>
                s.id === serverId
                  ? {
                      ...s,
                      connectionStatus:
                        (status.status as 'connected' | 'error' | 'unknown') || 'unknown',
                      toolsCount: status.toolsCount,
                      enabledToolsCount: status.enabledToolsCount,
                      connectionError: status.error || undefined,
                      validationDetails: status.details || undefined,
                      oauthRequired: !!status.oauthRequired,
                    }
                  : s
              )
            );
          }
        } catch {
          // Fallback: refresh all servers
          await fetchServers(true);
        }
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
    setPresetData(null);
  };

  if (loading) {
    return <div className="p-4">Loading MCP servers...</div>;
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-gray-900">My MCP Servers</h2>
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
          {servers.map((server) => {
            const shareInfo = sharingSummary[server.id];
            const isOwner = server.userId === session?.user?.id;
            const isSharedUseOnly =
              !isOwner && shareInfo?.inbound && shareInfo.inbound.permission === 'use';
            const canEdit =
              isOwner || !shareInfo?.inbound || shareInfo.inbound.permission === 'admin';
            return (
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
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditForm(server)}
                              aria-label={`Edit ${server.name}`}
                            >
                              Edit
                            </Button>
                          )}
                          {(isOwner || (!isSharedUseOnly && !shareInfo?.inbound)) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(server.id)}
                              aria-label={`Delete ${server.name}`}
                              className="text-destructive hover:text-destructive"
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {/* Type badge */}
                        <Badge variant={server.type === 'builtin' ? 'default' : 'secondary'}>
                          {server.type}
                        </Badge>
                        {/* Tools count badge */}
                        {server.connectionStatus === undefined ? (
                          <Badge variant="outline" className="animate-pulse">
                            <span className="inline-block w-8 h-3 bg-gray-200 rounded" />
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className={
                              server.enabledToolsCount !== undefined &&
                              server.enabledToolsCount !== server.toolsCount
                                ? 'border-amber-300 text-amber-700'
                                : undefined
                            }
                          >
                            {server.enabledToolsCount !== undefined &&
                            server.enabledToolsCount !== server.toolsCount
                              ? `${server.enabledToolsCount}/${server.toolsCount} tools`
                              : `${server.toolsCount ?? 0} tool${(server.toolsCount ?? 0) !== 1 ? 's' : ''}`}
                          </Badge>
                        )}
                        {/* Connection status badge */}
                        {server.connectionStatus === undefined ? (
                          <Badge variant="secondary" className="animate-pulse">
                            <span className="inline-block w-12 h-3 bg-gray-200 rounded" />
                          </Badge>
                        ) : (
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
                        )}
                        {/* Shared badge */}
                        {(() => {
                          const info = sharingSummary[server.id];
                          return (
                            <>
                              {info?.inbound && (
                                <Badge variant="secondary">
                                  Shared ·{' '}
                                  {info.inbound.permission.charAt(0).toUpperCase() +
                                    info.inbound.permission.slice(1)}
                                </Badge>
                              )}
                              {info?.outbound && (
                                <Badge variant="outline">
                                  Sharing · {info.outbound.total} member
                                  {info.outbound.total !== 1 ? 's' : ''}
                                </Badge>
                              )}
                            </>
                          );
                        })()}
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
                          <Alert
                            variant="default"
                            className="mt-3 py-2 border-amber-200 bg-amber-50"
                          >
                            <AlertDescription className="text-xs text-amber-800">
                              <span className="font-medium">API Key Required:</span>{' '}
                              {server.metadata.apiKeyHint ||
                                'This built-in server requires an API key to function. Click Edit to configure.'}
                            </AlertDescription>
                          </Alert>
                        )}
                      {/* OAuth configuration or OAuth required */}
                      {(server.oauthConfig || server.oauthRequired) && (
                        <div className="mt-3 flex items-center gap-2">
                          <Badge variant="outline">OAuth</Badge>
                          {server.oauthConfig?.authorizationServerUrl && (
                            <span className="text-xs text-muted-foreground truncate max-w-xs">
                              {server.oauthConfig.authorizationServerUrl}
                            </span>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOAuthAuthorize(server.id)}
                          >
                            {server.oauthRequired ? 'Login with OAuth' : 'Re-authorize'}
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
            );
          })}
        </div>
      )}

      <McpPresetGallery
        onAdd={async (server) => {
          const created = server as { id: string } & Record<string, unknown>;
          await fetchServers(true);
          // Re-fetch the individual server to get metadata-enriched version
          const response = await apiFetch(`/api/mcp-servers/${created.id}`);
          if (response.ok) {
            const enriched = await response.json();
            openEditForm(enriched as McpServer);
          } else {
            openEditForm(server as unknown as McpServer);
          }
        }}
        onConfigurePreset={(preset) => {
          setPresetData(preset);
          setEditingServer(null);
          setIsFormOpen(true);
        }}
      />

      <McpServerForm
        server={editingServer}
        presetData={presetData}
        onSave={editingServer ? handleUpdate : handleCreate}
        onCancel={closeForm}
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
      />
    </div>
  );
}
