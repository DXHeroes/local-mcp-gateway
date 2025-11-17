/**
 * MCP Server Detail page
 * Shows server details, tools list, and debug logs
 */

import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@local-mcp/ui';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';

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

interface McpTool {
  name: string;
  description?: string;
  inputSchema?: unknown;
}

interface DebugLog {
  id: string;
  profileId: string;
  mcpServerId?: string;
  requestType: string;
  requestPayload: string;
  responsePayload?: string;
  status: 'pending' | 'success' | 'error';
  errorMessage?: string;
  durationMs?: number;
  createdAt: number;
}

const API_URL = '';

export default function McpServerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [server, setServer] = useState<McpServer | null>(null);
  const [tools, setTools] = useState<McpTool[]>([]);
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'error' | 'unknown'>(
    'unknown'
  );
  const [connectionError, setConnectionError] = useState<string | undefined>();

  const fetchServerDetails = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch server details
      const serverResponse = await fetch(`${API_URL}/api/mcp-servers/${id}`);
      if (!serverResponse.ok) {
        throw new Error('Failed to fetch MCP server');
      }
      const serverData = await serverResponse.json();
      setServer(serverData);

      // Fetch tools
      try {
        const toolsResponse = await fetch(`${API_URL}/api/mcp-servers/${id}/tools`);
        if (toolsResponse.ok) {
          const toolsData = await toolsResponse.json();
          setTools(Array.isArray(toolsData.tools) ? toolsData.tools : []);
        } else if (toolsResponse.status === 401) {
          // Check if OAuth is required
          const errorData = await toolsResponse.json();
          if (errorData.oauthUrl) {
            // Auto-open OAuth popup
            const popup = window.open(
              `${API_URL}${errorData.oauthUrl}`,
              '_blank',
              'width=600,height=700'
            );

            // Listen for OAuth callback
            const handleMessage = (event: MessageEvent) => {
              if (event.data.type === 'oauth-callback' && event.data.success) {
                window.removeEventListener('message', handleMessage);
                popup?.close();
                // Retry fetching tools
                fetchServerDetails();
              } else if (event.data.type === 'oauth-callback' && !event.data.success) {
                window.removeEventListener('message', handleMessage);
                popup?.close();
                setError(event.data.error || 'OAuth authorization failed');
              }
            };
            window.addEventListener('message', handleMessage);
          }
        }
      } catch {
        setTools([]);
      }

      // Fetch connection status
      try {
        const statusResponse = await fetch(`${API_URL}/api/mcp-servers/${id}/status`);
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          setConnectionStatus(statusData.status || 'unknown');
          setConnectionError(statusData.error || undefined);
        } else if (statusResponse.status === 401) {
          // Check if OAuth is required
          const errorData = await statusResponse.json();
          if (errorData.oauthUrl) {
            // Auto-open OAuth popup
            const popup = window.open(
              `${API_URL}${errorData.oauthUrl}`,
              '_blank',
              'width=600,height=700'
            );

            // Listen for OAuth callback
            const handleMessage = (event: MessageEvent) => {
              if (event.data.type === 'oauth-callback' && event.data.success) {
                window.removeEventListener('message', handleMessage);
                popup?.close();
                // Retry fetching status
                fetchServerDetails();
              } else if (event.data.type === 'oauth-callback' && !event.data.success) {
                window.removeEventListener('message', handleMessage);
                popup?.close();
                setError(event.data.error || 'OAuth authorization failed');
              }
            };
            window.addEventListener('message', handleMessage);
          }
        }
      } catch {
        setConnectionStatus('unknown');
      }

      // Fetch debug logs filtered by server ID
      // Note: Logs may have mcpServerId set if profile has only one server,
      // or mcpServerId may be undefined for aggregated requests
      // We'll fetch logs for this server ID specifically
      try {
        const logsResponse = await fetch(`${API_URL}/api/debug/logs?mcpServerId=${id}&limit=50`);
        if (logsResponse.ok) {
          const logsData = await logsResponse.json();
          // Filter to ensure we only show logs for this server
          const filteredLogs = Array.isArray(logsData)
            ? logsData.filter((log: DebugLog) => log.mcpServerId === id)
            : [];
          setDebugLogs(filteredLogs);
        }
      } catch {
        setDebugLogs([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchServerDetails();
  }, [fetchServerDetails]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatJson = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonString;
    }
  };

  if (loading) {
    return <div className="p-6">Loading server details...</div>;
  }

  if (error || !server) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            {error || 'Server not found'}
            <div className="mt-2">
              <Button onClick={() => navigate('/mcp-servers')}>Back to Servers</Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{server.name}</h2>
          <p className="text-sm text-muted-foreground mt-1">Type: {server.type}</p>
        </div>
        <Button onClick={() => navigate('/mcp-servers')} variant="outline">
          Back to Servers
        </Button>
      </div>

      {/* Connection Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <span
              className={`inline-block w-3 h-3 rounded-full ${
                connectionStatus === 'connected'
                  ? 'bg-green-500'
                  : connectionStatus === 'error'
                    ? 'bg-red-500'
                    : 'bg-gray-400'
              }`}
            />
            <span className="font-medium">
              {connectionStatus === 'connected'
                ? 'Connected'
                : connectionStatus === 'error'
                  ? 'Error'
                  : 'Unknown'}
            </span>
            {connectionError && (
              <span className="text-sm text-muted-foreground">- {connectionError}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tools List */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Tools ({tools.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {tools.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tools available</p>
          ) : (
            <div className="space-y-4">
              {tools.map((tool) => (
                <div key={tool.name} className="border-b pb-4 last:border-0">
                  <h4 className="font-semibold text-lg">{tool.name}</h4>
                  {tool.description && (
                    <p className="text-sm text-muted-foreground mt-1">{tool.description}</p>
                  )}
                  {tool.inputSchema && (
                    <details className="mt-2">
                      <summary className="text-sm text-muted-foreground cursor-pointer">
                        View input schema
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                        {JSON.stringify(tool.inputSchema, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Debug Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Logs ({debugLogs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {debugLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No debug logs found for this server. Logs will appear here when the server is used in
              a profile.
            </p>
          ) : (
            <div className="space-y-4">
              {debugLogs.map((log) => (
                <Card key={log.id} className="border">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-sm">{log.requestType}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(log.createdAt)}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          log.status === 'success'
                            ? 'bg-green-100 text-green-800'
                            : log.status === 'error'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {log.status}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {log.durationMs !== undefined && (
                        <p className="text-xs text-muted-foreground">
                          Duration: {log.durationMs}ms
                        </p>
                      )}
                      {log.errorMessage && (
                        <Alert variant="destructive">
                          <AlertDescription className="text-xs">
                            {log.errorMessage}
                          </AlertDescription>
                        </Alert>
                      )}
                      <details>
                        <summary className="text-sm text-muted-foreground cursor-pointer">
                          Request Payload
                        </summary>
                        <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                          {formatJson(log.requestPayload)}
                        </pre>
                      </details>
                      {log.responsePayload && (
                        <details>
                          <summary className="text-sm text-muted-foreground cursor-pointer">
                            Response Payload
                          </summary>
                          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                            {formatJson(log.responsePayload)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
