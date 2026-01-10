/**
 * Profile Edit Page
 *
 * Main page for editing profile MCP server tools and customizations
 */

import { Button, useToast } from '@dxheroes/local-mcp-ui';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { McpServerToolsCard } from '../components/McpServerToolsCard';
import { API_URL } from '../config/api';

interface Profile {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

interface ServerWithTools {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  order: number;
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

export default function ProfileEditPage() {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [servers, setServers] = useState<ServerWithTools[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profileId) {
      fetchProfileData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  const fetchProfileData = async () => {
    if (!profileId) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Load profile
      const profileRes = await fetch(`${API_URL}/api/profiles/${profileId}`);
      if (!profileRes.ok) {
        throw new Error('Profile not found');
      }
      const profileData = await profileRes.json();
      setProfile(profileData);

      // 2. Load servers for profile
      const serversRes = await fetch(`${API_URL}/api/profiles/${profileId}/servers`);
      if (!serversRes.ok) {
        throw new Error('Failed to load servers');
      }
      const serversList = await serversRes.json();

      // Ensure serversList is an array
      if (!Array.isArray(serversList)) {
        setServers([]);
        setLoading(false);
        return;
      }

      // 3. For each server, load full details and tools
      const serversData = await Promise.all(
        serversList.map(
          async (server: { mcpServerId: string; order: number; isActive: boolean }) => {
            // Load server details
            const serverRes = await fetch(`${API_URL}/api/mcp-servers/${server.mcpServerId}`);
            if (!serverRes.ok) {
              throw new Error(`Failed to load server ${server.mcpServerId}`);
            }
            const serverDetail = await serverRes.json();

            // Load tools with customizations (only if active)
            let tools = [];
            if (server.isActive) {
              try {
                const toolsRes = await fetch(
                  `${API_URL}/api/profiles/${profileId}/servers/${server.mcpServerId}/tools`
                );
                if (toolsRes.ok) {
                  const toolsData = await toolsRes.json();
                  tools = toolsData.tools || [];
                }
              } catch (err) {
                console.error(`Failed to load tools for server ${server.mcpServerId}:`, err);
              }
            }

            return {
              id: serverDetail.id,
              name: serverDetail.name,
              type: serverDetail.type,
              isActive: server.isActive,
              order: server.order,
              tools,
            };
          }
        )
      );

      // Sort by order
      serversData.sort((a, b) => a.order - b.order);
      setServers(serversData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load profile data';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleServer = async (serverId: string, isActive: boolean) => {
    if (!profileId) return;

    try {
      const response = await fetch(
        `${API_URL}/api/profiles/${profileId}/servers/${serverId}/toggle`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to toggle server');
      }

      // Update local state
      setServers((prev) =>
        prev.map((s) =>
          s.id === serverId ? { ...s, isActive, tools: isActive ? s.tools : [] } : s
        )
      );

      // If activating, fetch tools
      if (isActive) {
        await handleRefreshTools(serverId);
      }

      toast({
        title: isActive ? 'Server Activated' : 'Server Deactivated',
        description: `${servers.find((s) => s.id === serverId)?.name} is now ${isActive ? 'active' : 'inactive'}`,
      });
    } catch (_error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to toggle server',
      });
    }
  };

  const handleRefreshTools = async (serverId: string) => {
    if (!profileId) return;
    const toolsRes = await fetch(
      `${API_URL}/api/profiles/${profileId}/servers/${serverId}/tools?refresh=true`
    );

    if (!toolsRes.ok) {
      throw new Error('Failed to refresh tools');
    }

    const toolsData = await toolsRes.json();

    // Update local state
    setServers((prev) =>
      prev.map((s) => (s.id === serverId ? { ...s, tools: toolsData.tools || [] } : s))
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-destructive mb-2">Error</h2>
            <p className="text-muted-foreground mb-4">{error || 'Profile not found'}</p>
            <Button onClick={() => navigate('/profiles')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Profiles
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/profiles')}
            className="mb-4"
            data-testid="back-button"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Profiles
          </Button>
          <h1 className="text-3xl font-bold" data-testid="profile-edit-heading">
            {profile.name}
          </h1>
          {profile.description && (
            <p className="text-muted-foreground mt-1">{profile.description}</p>
          )}
          <p className="text-sm text-muted-foreground mt-2">
            Configure MCP servers and customize tools for this profile
          </p>
        </div>

        {/* Servers List */}
        {servers.length === 0 ? (
          <div className="text-center text-muted-foreground py-12 border border-dashed rounded-lg">
            <p className="mb-4">No MCP servers assigned to this profile yet.</p>
            <Button onClick={() => navigate('/profiles')}>Add Servers to Profile</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {servers.map((server) => (
              <McpServerToolsCard
                key={server.id}
                profileId={profileId!}
                server={server}
                onToggle={handleToggleServer}
                onRefresh={handleRefreshTools}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
