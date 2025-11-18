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
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  useToast,
} from '@local-mcp/ui';
import { ChevronDown, ChevronUp, Copy, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import ProfileForm from '../components/ProfileForm';
import { generateToonPrompt } from '../utils/promptGenerator';

// Profile type will be imported from API response
interface Profile {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

interface ProfileWithServerCount extends Profile {
  serverCount?: number;
  toolsCount?: number;
}

const API_URL = '';

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<ProfileWithServerCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<Profile | null>(null);
  const { toast } = useToast();

  const [prompts, setPrompts] = useState<Record<string, string>>({});
  const [loadingPrompts, setLoadingPrompts] = useState<Record<string, boolean>>({});
  const [expandedPrompts, setExpandedPrompts] = useState<Record<string, boolean>>({});

  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/profiles`);
      if (!response.ok) {
        throw new Error('Failed to fetch profiles');
      }
      const data = await response.json();

      // Fetch server count and tools count for each profile
      const profilesWithCounts = await Promise.all(
        data.map(async (profile: Profile) => {
          let serverCount = 0;
          let toolsCount = 0;

          try {
            const serversResponse = await fetch(`${API_URL}/api/profiles/${profile.id}/servers`);
            if (serversResponse.ok) {
              const serversData = await serversResponse.json();
              serverCount = serversData.serverIds?.length || 0;
            }
          } catch {
            // Ignore errors
          }

          // Fetch tools count if profile has servers
          if (serverCount > 0) {
            try {
              const infoResponse = await fetch(`${API_URL}/api/mcp/${profile.name}/info`);
              if (infoResponse.ok) {
                const infoData = await infoResponse.json();
                toolsCount = Array.isArray(infoData.tools) ? infoData.tools.length : 0;
              }
            } catch {
              // Ignore errors - server might not be initialized yet
            }
          }

          return { ...profile, serverCount, toolsCount };
        })
      );

      setProfiles(profilesWithCounts);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

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
      const currentServerIds = new Set(currentServersData.serverIds || []);

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

  const getFullEndpointUrl = (profileName: string): string => {
    const baseUrl = API_URL || window.location.origin;
    return `${baseUrl}/api/mcp/${profileName}`;
  };

  const handleCopyEndpoint = async (profileName: string) => {
    const endpoint = getFullEndpointUrl(profileName);
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

  const getPrompt = async (profile: Profile) => {
    if (prompts[profile.id]) return prompts[profile.id];

    setLoadingPrompts((prev) => ({ ...prev, [profile.id]: true }));
    try {
      const endpoint = getFullEndpointUrl(profile.name);
      const response = await fetch(`${endpoint}/info`);
      if (!response.ok) {
        throw new Error('Failed to fetch tools info');
      }
      const data = await response.json();
      const tools = Array.isArray(data.tools) ? data.tools : [];

      const toonPrompt = generateToonPrompt(profile.name, endpoint, tools);

      setPrompts((prev) => ({ ...prev, [profile.id]: toonPrompt }));
      return toonPrompt;
    } catch (err) {
      console.error('Failed to generate prompt:', err);
      toast({
        title: 'Error',
        description: 'Failed to generate AI prompt',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoadingPrompts((prev) => ({ ...prev, [profile.id]: false }));
    }
  };

  const togglePrompt = async (profile: Profile) => {
    const isExpanded = !expandedPrompts[profile.id];
    setExpandedPrompts((prev) => ({ ...prev, [profile.id]: isExpanded }));

    if (isExpanded && !prompts[profile.id]) {
      await getPrompt(profile);
    }
  };

  const copyPrompt = async (profile: Profile, e: React.MouseEvent) => {
    e.stopPropagation();
    let prompt = prompts[profile.id];
    if (!prompt) {
      const result = await getPrompt(profile);
      if (result) {
        prompt = result;
      }
    }

    if (prompt) {
      try {
        await navigator.clipboard.writeText(prompt);
        toast({
          title: 'Copied!',
          description: 'AI Prompt copied to clipboard',
          variant: 'default',
        });
      } catch {
        toast({
          title: 'Failed',
          description: 'Failed to copy to clipboard',
          variant: 'destructive',
        });
      }
    }
  };

  const openCreateForm = () => {
    setEditingProfile(null);
    setIsFormOpen(true);
  };

  const openEditForm = (profile: Profile) => {
    setEditingProfile(profile);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingProfile(null);
  };

  if (loading) {
    return <div className="p-6">Loading profiles...</div>;
  }

  return (
    <div className="p-6">
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
                      onClick={() => openEditForm(profile)}
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
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">MCP Servers:</p>
                    <span className="text-xs px-2 py-1 bg-muted rounded">
                      {profile.serverCount ?? 0} server{(profile.serverCount ?? 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {profile.toolsCount !== undefined && (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Tools:</p>
                      <span className="text-xs px-2 py-1 bg-muted rounded">
                        {profile.toolsCount} tool{profile.toolsCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">MCP Endpoint:</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded flex-1 break-all">
                        {getFullEndpointUrl(profile.name)}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyEndpoint(profile.name)}
                        aria-label="Copy endpoint to clipboard"
                      >
                        Copy
                      </Button>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between mb-1">
                      <button
                        type="button"
                        onClick={() => togglePrompt(profile)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
                      >
                        {expandedPrompts[profile.id] ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                        AI Prompt
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        onClick={(e) => copyPrompt(profile, e)}
                        disabled={loadingPrompts[profile.id]}
                        aria-label="Copy AI prompt"
                      >
                        {loadingPrompts[profile.id] ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        <span className="ml-1 text-xs">Copy</span>
                      </Button>
                    </div>
                    {expandedPrompts[profile.id] && (
                      <div className="relative mt-1">
                        {loadingPrompts[profile.id] ? (
                          <div className="flex items-center justify-center p-4 bg-muted rounded text-xs text-muted-foreground">
                            <Loader2 className="h-3 w-3 animate-spin mr-2" />
                            Generating prompt...
                          </div>
                        ) : (
                          <pre className="text-[10px] bg-muted p-2 rounded overflow-x-auto max-h-40 whitespace-pre-wrap font-mono">
                            {prompts[profile.id] || 'No tools available'}
                          </pre>
                        )}
                      </div>
                    )}
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
