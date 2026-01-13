/**
 * Profile Form Component
 *
 * Form for creating and editing profiles
 */

import {
  Alert,
  AlertDescription,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@dxheroes/local-mcp-ui';
import { Info } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface Profile {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

interface McpServer {
  id: string;
  name: string;
  type: 'external' | 'custom' | 'remote_http' | 'remote_sse';
}

interface ProfileFormProps {
  profile?: Profile | null;
  onSave: (data: { name: string; description?: string; serverIds?: string[] }) => Promise<void>;
  onCancel: () => void;
  isOpen: boolean;
  onOpenChange?: (open: boolean) => void;
}

import { API_URL } from '../config/api';

export default function ProfileForm({
  profile,
  onSave,
  onCancel,
  isOpen,
  onOpenChange,
}: ProfileFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allServers, setAllServers] = useState<McpServer[]>([]);
  const [selectedServerIds, setSelectedServerIds] = useState<Set<string>>(new Set());
  const [serversLoading, setServersLoading] = useState(false);

  // Fetch all available MCP servers
  const fetchAllServers = useCallback(async () => {
    try {
      setServersLoading(true);
      const response = await fetch(`${API_URL}/api/mcp-servers`);
      if (!response.ok) {
        throw new Error('Failed to fetch MCP servers');
      }
      const servers = await response.json();
      setAllServers(servers);
    } catch (err) {
      console.error('Failed to fetch servers:', err);
      // Don't show error to user, just log it
    } finally {
      setServersLoading(false);
    }
  }, []);

  // Fetch servers assigned to profile (when editing)
  const fetchProfileServers = useCallback(async (profileId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/profiles/${profileId}/servers`);
      if (!response.ok) {
        throw new Error('Failed to fetch profile servers');
      }
      const data = await response.json();
      const serverIds = data.serverIds || [];
      setSelectedServerIds(new Set(serverIds));
    } catch (err) {
      console.error('Failed to fetch profile servers:', err);
      setSelectedServerIds(new Set());
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchAllServers();
      if (profile) {
        fetchProfileServers(profile.id);
      } else {
        setSelectedServerIds(new Set());
      }
    }
  }, [isOpen, profile, fetchAllServers, fetchProfileServers]);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setDescription(profile.description || '');
    } else {
      setName('');
      setDescription('');
      setSelectedServerIds(new Set());
    }
    setError(null);
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      setError('Name must contain only alphanumeric characters, dashes, and underscores');
      return;
    }

    if (name.length > 50) {
      setError('Name must be 50 characters or less');
      return;
    }

    if (description && description.length > 500) {
      setError('Description must be 500 characters or less');
      return;
    }

    try {
      setIsSubmitting(true);

      // Save profile first
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        serverIds: Array.from(selectedServerIds),
      });

      // Reset form on success
      setName('');
      setDescription('');
      setSelectedServerIds(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleServerToggle = (serverId: string, checked: boolean) => {
    const newSelected = new Set(selectedServerIds);
    if (checked) {
      newSelected.add(serverId);
    } else {
      newSelected.delete(serverId);
    }
    setSelectedServerIds(newSelected);
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
          <DialogTitle>{profile ? 'Edit Profile' : 'Create Profile'}</DialogTitle>
          <DialogDescription>
            {profile
              ? 'Update profile details below.'
              : 'Create a new profile to group MCP servers.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="profile-name">
                Name <span className="text-red-500">*</span>
              </Label>
              {profile && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Profile name cannot be changed after creation</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <Input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              placeholder="my-profile"
              required
              disabled={isSubmitting || !!profile} // Can't change name when editing
            />
            <p className="text-xs text-muted-foreground">
              Alphanumeric characters, dashes, and underscores only
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-description">Description</Label>
            <Textarea
              id="profile-description"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setDescription(e.target.value)
              }
              placeholder="Optional description"
              rows={3}
              maxLength={500}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">{description.length}/500 characters</p>
          </div>

          {/* MCP Servers Section */}
          <div className="space-y-2 border-t pt-4">
            <Label>MCP Servers</Label>
            {serversLoading ? (
              <p className="text-sm text-muted-foreground">Loading servers...</p>
            ) : allServers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No MCP servers available. Create servers first on the MCP Servers page.
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-3">
                {allServers.map((server) => (
                  <div key={server.id} className="flex items-center space-x-2 py-1">
                    <Checkbox
                      id={`server-${server.id}`}
                      checked={selectedServerIds.has(server.id)}
                      onCheckedChange={(checked) => handleServerToggle(server.id, checked === true)}
                      disabled={isSubmitting}
                    />
                    <Label
                      htmlFor={`server-${server.id}`}
                      className="flex-1 cursor-pointer font-normal"
                    >
                      {server.name}
                    </Label>
                    <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">
                      {server.type}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {selectedServerIds.size > 0 && (
              <p className="text-xs text-muted-foreground">
                {selectedServerIds.size} server{selectedServerIds.size !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : profile ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
