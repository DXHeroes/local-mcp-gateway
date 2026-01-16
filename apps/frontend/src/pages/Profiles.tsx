/**
 * Profiles page - Minimalist developer-first design
 */

import {
  Alert,
  AlertDescription,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  useToast,
} from '@dxheroes/local-mcp-ui';
import { Check, Copy, Eye, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import GatewayConfig from '../components/GatewayConfig';
import ProfileForm from '../components/ProfileForm';
import { API_URL, getGatewayUrl, getProfileUrl } from '../config/api';

interface Profile {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

interface ServerStatus {
  total: number;
  connected: number;
  status: Record<string, boolean>;
}

interface ProfileWithStatus extends Profile {
  serverStatus?: ServerStatus;
  toolsCount?: number;
}

export default function ProfilesPage() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<ProfileWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<Profile | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  // Gateway settings state
  const [defaultGatewayProfile, setDefaultGatewayProfile] = useState<string | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);

  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/profiles`);
      if (!response.ok) {
        throw new Error('Failed to fetch profiles');
      }
      const data = await response.json();

      // Fetch server status and tools count for each profile
      const profilesWithStatus = await Promise.all(
        data.map(async (profile: Profile) => {
          let serverStatus: ServerStatus = { total: 0, connected: 0, status: {} };
          let toolsCount = 0;

          try {
            const infoResponse = await fetch(`${API_URL}/api/mcp/${profile.name}/info`);
            if (infoResponse.ok) {
              const infoData = await infoResponse.json();
              toolsCount = Array.isArray(infoData.tools) ? infoData.tools.length : 0;
              if (infoData.serverStatus) {
                serverStatus = infoData.serverStatus;
              }
            }
          } catch {
            // Ignore errors
          }

          return { ...profile, serverStatus, toolsCount };
        })
      );

      setProfiles(profilesWithStatus);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/settings/default-gateway-profile`);
      if (response.ok) {
        const data = await response.json();
        setDefaultGatewayProfile(data.profileName);
      }
    } catch (err) {
      console.warn('Failed to fetch gateway settings:', err);
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
    fetchSettings();
  }, [fetchProfiles, fetchSettings]);

  const handleGatewayProfileChange = async (profileName: string) => {
    const previous = defaultGatewayProfile;
    setDefaultGatewayProfile(profileName);

    try {
      const response = await fetch(`${API_URL}/api/settings/default-gateway-profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileName }),
      });

      if (!response.ok) {
        throw new Error('Failed to update gateway profile');
      }

      toast({
        variant: 'success',
        title: 'Gateway profile updated',
        description: `Active profile set to "${profileName}"`,
      });
    } catch {
      setDefaultGatewayProfile(previous);
      toast({
        variant: 'danger',
        title: 'Error',
        description: 'Failed to update gateway profile',
      });
    }
  };

  const handleCreate = async (data: {
    name: string;
    description?: string;
    serverIds?: string[];
  }) => {
    const response = await fetch(`${API_URL}/api/profiles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: data.name, description: data.description }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create profile');
    }

    const profile = await response.json();

    if (data.serverIds && data.serverIds.length > 0) {
      await Promise.all(
        data.serverIds.map((serverId, index) =>
          fetch(`${API_URL}/api/profiles/${profile.id}/servers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mcpServerId: serverId, order: index }),
          })
        )
      );
    }

    await fetchProfiles();
    setIsFormOpen(false);
  };

  const handleUpdate = async (data: {
    name: string;
    description?: string;
    serverIds?: string[];
  }) => {
    if (!editingProfile) return;

    const response = await fetch(`${API_URL}/api/profiles/${editingProfile.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: data.name, description: data.description }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update profile');
    }

    if (data.serverIds !== undefined) {
      const currentServersResponse = await fetch(
        `${API_URL}/api/profiles/${editingProfile.id}/servers`
      );
      const currentServersData = await currentServersResponse.json();
      const currentServerIds = new Set(
        Array.isArray(currentServersData)
          ? currentServersData.map((item: { mcpServerId: string }) => item.mcpServerId)
          : []
      );

      const newServerIds = new Set(data.serverIds);

      for (const serverId of currentServerIds) {
        if (typeof serverId === 'string' && !newServerIds.has(serverId)) {
          await fetch(`${API_URL}/api/profiles/${editingProfile.id}/servers/${serverId}`, {
            method: 'DELETE',
          });
        }
      }

      if (data.serverIds) {
        for (const serverId of newServerIds) {
          if (!currentServerIds.has(serverId)) {
            await fetch(`${API_URL}/api/profiles/${editingProfile.id}/servers`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                mcpServerId: serverId,
                order: data.serverIds.indexOf(serverId),
              }),
            });
          }
        }
      }
    }

    await fetchProfiles();
    setIsFormOpen(false);
    setEditingProfile(null);
  };

  const handleDeleteClick = (e: React.MouseEvent, profile: Profile) => {
    e.stopPropagation();
    setProfileToDelete(profile);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!profileToDelete) return;

    try {
      const response = await fetch(`${API_URL}/api/profiles/${profileToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete profile');
      }

      await fetchProfiles();
      setDeleteDialogOpen(false);
      setProfileToDelete(null);
      toast({
        variant: 'success',
        title: 'Profile deleted',
        description: `Profile "${profileToDelete.name}" has been deleted.`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete profile');
      setDeleteDialogOpen(false);
    }
  };

  const handleCopyEndpoint = async (
    e: React.MouseEvent,
    profileId: string,
    profileName: string
  ) => {
    e.stopPropagation();
    const endpoint = getProfileUrl(profileName);
    try {
      await navigator.clipboard.writeText(endpoint);
      setCopiedId(profileId);
      toast({
        variant: 'success',
        title: 'Copied!',
        description: 'Endpoint copied to clipboard',
      });
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast({
        variant: 'danger',
        title: 'Failed to copy',
        description: 'Could not copy endpoint',
      });
    }
  };

  const openCreateForm = () => {
    setEditingProfile(null);
    setIsFormOpen(true);
  };

  const openEditForm = (e: React.MouseEvent, profile: Profile) => {
    e.stopPropagation();
    setEditingProfile(profile);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingProfile(null);
  };

  const getStatusDot = (status?: ServerStatus) => {
    if (!status || status.total === 0) return 'bg-gray-300';
    if (status.connected === 0 && status.total > 0) return 'bg-red-500';
    if (status.connected < status.total) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = (status?: ServerStatus, toolsCount?: number) => {
    const servers = status ? `${status.connected}/${status.total} servers` : '0 servers';
    const tools = `${toolsCount || 0} tools`;
    return `${servers} · ${tools}`;
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-200 rounded" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <GatewayConfig
        profiles={profiles}
        defaultProfileName={defaultGatewayProfile}
        onProfileChange={handleGatewayProfileChange}
        isLoading={settingsLoading || loading}
      />

      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Profiles</h2>
        <Button onClick={openCreateForm} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          New Profile
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!error && profiles.length === 0 ? (
        <EmptyState onCreateClick={openCreateForm} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => (
            <Card
              key={profile.id}
              className="cursor-pointer hover:shadow-md transition-shadow p-4"
              onClick={() => navigate(`/profiles/${profile.id}/edit`)}
            >
              {/* Header: Status dot + Name + Menu */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`h-2 w-2 rounded-full shrink-0 ${getStatusDot(profile.serverStatus)}`}
                  />
                  <h3 className="font-medium text-base truncate">{profile.name}</h3>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/profiles/${profile.id}/edit`);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => openEditForm(e, profile)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => handleDeleteClick(e, profile)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Status line */}
              <p className="text-xs text-muted-foreground mb-3">
                {getStatusText(profile.serverStatus, profile.toolsCount)}
              </p>

              {/* Endpoint */}
              {/* biome-ignore lint/a11y/useKeyWithClickEvents: onClick only stops propagation */}
              {/* biome-ignore lint/a11y/noStaticElementInteractions: container for endpoint copy */}
              <div
                className="flex items-center gap-2 bg-muted rounded px-2 py-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                <code className="flex-1 text-xs font-mono truncate select-all cursor-text">
                  {getProfileUrl(profile.name)}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 shrink-0"
                  onClick={(e) => handleCopyEndpoint(e, profile.id, profile.name)}
                >
                  {copiedId === profile.id ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ProfileForm
        profile={editingProfile}
        onSave={editingProfile ? handleUpdate : handleCreate}
        onCancel={closeForm}
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete profile?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{profileToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProfileToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/**
 * Empty state with quick-start guide
 */
function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const configSnippet = `{
  "mcpServers": {
    "gateway": {
      "type": "http",
      "url": "${getGatewayUrl()}"
    }
  }
}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(configSnippet);
      setCopied(true);
      toast({
        variant: 'success',
        title: 'Copied!',
        description: 'Config snippet copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ variant: 'danger', title: 'Failed to copy' });
    }
  };

  return (
    <div className="text-center py-12 px-4">
      <div className="max-w-md mx-auto">
        <h3 className="text-lg font-semibold mb-4">Quick Start</h3>
        <ol className="text-sm text-muted-foreground text-left mb-6 space-y-2">
          <li className="flex gap-2">
            <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">1</span>
            Create a profile
          </li>
          <li className="flex gap-2">
            <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">2</span>
            Add MCP servers to it
          </li>
          <li className="flex gap-2">
            <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">3</span>
            Copy endpoint to your AI client
          </li>
        </ol>

        <div className="bg-muted rounded-lg p-3 mb-6 text-left relative">
          <pre className="text-xs font-mono overflow-x-auto whitespace-pre">{configSnippet}</pre>
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-7 w-7 p-0"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>

        <Button onClick={onCreateClick}>
          <Plus className="h-4 w-4 mr-1" />
          Create First Profile
        </Button>
      </div>
    </div>
  );
}
