/**
 * Profiles page
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
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  useToast,
} from '@dxheroes/local-mcp-ui';
import { Copy } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import GatewayConfig from '../components/GatewayConfig';
import ProfileForm from '../components/ProfileForm';

// Profile type will be imported from API response
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

import { API_URL, getProfileUrl } from '../config/api';

export default function ProfilesPage() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<ProfileWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<Profile | null>(null);
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
      } else {
        console.warn('Failed to fetch gateway settings, using default');
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
    setDefaultGatewayProfile(profileName); // Optimistic update

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
        title: 'Gateway profile updated',
        description: `Active profile set to "${profileName}"`,
      });
    } catch {
      setDefaultGatewayProfile(previous); // Rollback on error
      toast({
        title: 'Error',
        description: 'Failed to update gateway profile',
        variant: 'destructive',
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

    // Add servers to profile if provided
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

    // Update profile
    const response = await fetch(`${API_URL}/api/profiles/${editingProfile.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: data.name, description: data.description }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update profile');
    }

    // Update server assignments
    if (data.serverIds !== undefined) {
      // Get current server assignments
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

      // Remove servers that are no longer selected
      for (const serverId of currentServerIds) {
        if (typeof serverId === 'string' && !newServerIds.has(serverId)) {
          await fetch(`${API_URL}/api/profiles/${editingProfile.id}/servers/${serverId}`, {
            method: 'DELETE',
          });
        }
      }

      // Add new servers
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

  const handleDeleteClick = (profile: Profile) => {
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
        title: 'Profile deleted',
        description: `Profile "${profileToDelete.name}" has been deleted.`,
        variant: 'default',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete profile');
      setDeleteDialogOpen(false);
    }
  };

  const handleCopyEndpoint = async (profileName: string) => {
    const endpoint = getProfileUrl(profileName);
    try {
      await navigator.clipboard.writeText(endpoint);
      toast({
        title: 'Copied!',
        description: 'MCP endpoint copied to clipboard',
        variant: 'default',
      });
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      toast({
        title: 'Failed to copy',
        description: 'Could not copy endpoint to clipboard',
        variant: 'destructive',
      });
    }
  };

  const openCreateForm = () => {
    setEditingProfile(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingProfile(null);
  };

  const getServerBadgeVariant = (status?: ServerStatus) => {
    if (!status || status.total === 0) return 'destructive';
    if (status.connected === 0 && status.total > 0) return 'destructive';
    if (status.connected < status.total) return 'warning';
    return 'success';
  };

  const getServerBadgeText = (status?: ServerStatus) => {
    if (!status || status.total === 0) return 'MCP Servers: 0';
    return `MCP Servers: ${status.connected}/${status.total}`;
  };

  if (loading) {
    return <div className="p-6">Loading profiles...</div>;
  }

  return (
    <div className="p-6">
      <GatewayConfig
        profiles={profiles}
        defaultProfileName={defaultGatewayProfile}
        onProfileChange={handleGatewayProfileChange}
        isLoading={settingsLoading || loading}
      />

      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Profiles</h2>
        <Button onClick={openCreateForm}>Create Profile</Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>Error: {error}</AlertDescription>
        </Alert>
      )}

      {!error && profiles.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">
            No profiles found. Create your first profile to get started.
          </p>
          <Button onClick={openCreateForm}>Create Profile</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => (
            <Card key={profile.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{profile.name}</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/profiles/${profile.id}/edit`)}
                      aria-label={`View details for ${profile.name}`}
                    >
                      Detail
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingProfile(profile);
                        setIsFormOpen(true);
                      }}
                      aria-label={`Edit ${profile.name}`}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(profile)}
                      aria-label={`Delete ${profile.name}`}
                      className="text-destructive hover:text-destructive"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {profile.description && (
                  <p className="mt-2 text-sm text-muted-foreground">{profile.description}</p>
                )}
                <div className="mt-4 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={getServerBadgeVariant(profile.serverStatus)}>
                      {getServerBadgeText(profile.serverStatus)}
                    </Badge>
                    <Badge variant={getServerBadgeVariant(profile.serverStatus)}>
                      Tools: {profile.toolsCount || 0}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">MCP Endpoint:</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded flex-1 break-all">
                        {getProfileUrl(profile.name)}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyEndpoint(profile.name)}
                        aria-label="Copy MCP endpoint to clipboard"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
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
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the profile "{profileToDelete?.name}". This action cannot
              be undone.
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
