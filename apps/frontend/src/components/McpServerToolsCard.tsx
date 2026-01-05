/**
 * MCP Server Tools Card Component
 *
 * Shows an MCP server with its tools in an expandable card
 */

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Switch,
  useToast,
} from '@dxheroes/local-mcp-ui';
import { ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { ToolsList } from './ToolsList';

interface McpServer {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  tools?: Array<{
    name: string;
    original: {
      name: string;
      description?: string;
      inputSchema?: unknown;
    };
    customized: {
      name: string;
      description?: string;
      inputSchema?: unknown;
    } | null;
    isEnabled: boolean;
    hasChanges: boolean;
    changeType?: 'added' | 'modified' | 'unchanged' | null;
  }>;
}

interface McpServerToolsCardProps {
  profileId: string;
  server: McpServer;
  onToggle: (serverId: string, isActive: boolean) => void;
  onRefresh: (serverId: string) => void;
}

export function McpServerToolsCard({
  profileId,
  server,
  onToggle,
  onRefresh,
}: McpServerToolsCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh(server.id);
      toast({
        title: 'Refreshed',
        description: 'Tools refreshed from remote server',
      });
    } catch (_error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to refresh tools',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const toolsCount = server.tools?.length || 0;
  const enabledToolsCount = server.tools?.filter((t) => t.isEnabled).length || 0;
  const changedToolsCount = server.tools?.filter((t) => t.hasChanges).length || 0;

  return (
    <Card className="mb-4" data-testid="server-card">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Switch
              checked={server.isActive}
              onCheckedChange={(checked: boolean) => onToggle(server.id, checked)}
              data-testid="server-active-toggle"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-lg break-words">{server.name}</CardTitle>
                <Badge variant="outline" className="shrink-0">
                  {server.type}
                </Badge>
                {!server.isActive && (
                  <Badge variant="outline" className="shrink-0 bg-muted text-muted-foreground">
                    Inactive
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                <span>
                  {enabledToolsCount} / {toolsCount} tools enabled
                </span>
                {changedToolsCount > 0 && (
                  <Badge
                    variant="outline"
                    className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700"
                  >
                    {changedToolsCount} remote {changedToolsCount === 1 ? 'change' : 'changes'}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing || !server.isActive}
              data-testid="refresh-button"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              data-testid="expand-button"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent>
          {!server.isActive ? (
            <div className="text-center text-muted-foreground py-8">
              <p>This MCP server is inactive. Activate it to manage tools.</p>
            </div>
          ) : server.tools && server.tools.length > 0 ? (
            <ToolsList
              profileId={profileId}
              serverId={server.id}
              tools={server.tools}
              onToolsUpdated={() => onRefresh(server.id)}
            />
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <p>No tools available. Click Refresh to fetch tools from the server.</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
