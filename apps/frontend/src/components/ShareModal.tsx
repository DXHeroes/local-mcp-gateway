/**
 * ShareModal Component
 *
 * Dialog for sharing profiles and MCP servers with users or organizations.
 */

import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useToast,
} from '@dxheroes/local-mcp-ui';
import { Loader2, Trash2, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { API_URL } from '../config/api';
import { authClient } from '../lib/auth-client';

interface Share {
  id: string;
  resourceType: string;
  resourceId: string;
  sharedWithType: 'user' | 'organization';
  sharedWithId: string;
  permission: string;
  sharedByUserId: string;
  createdAt: string;
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceType: 'profile' | 'mcp_server';
  resourceId: string;
}

export default function ShareModal({ isOpen, onClose, resourceType, resourceId }: ShareModalProps) {
  const { toast } = useToast();
  const { data: orgList } = authClient.useListOrganizations();

  const [shares, setShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [sharedWithType, setSharedWithType] = useState<'user' | 'organization'>('user');
  const [sharedWithId, setSharedWithId] = useState('');
  const [permission, setPermission] = useState('use');

  const organizations = orgList ?? [];

  const fetchShares = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/sharing/${resourceType}/${resourceId}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setShares(Array.isArray(data) ? data : []);
      }
    } catch {
      // Ignore fetch errors
    } finally {
      setLoading(false);
    }
  }, [resourceType, resourceId]);

  useEffect(() => {
    if (isOpen) {
      fetchShares();
      // Reset form
      setSharedWithType('user');
      setSharedWithId('');
      setPermission('use');
    }
  }, [isOpen, fetchShares]);

  const handleAddShare = async () => {
    if (!sharedWithId.trim()) {
      toast({
        variant: 'danger',
        title: 'Error',
        description:
          sharedWithType === 'user' ? 'Please enter a user email' : 'Please select an organization',
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/sharing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          resourceType,
          resourceId,
          sharedWithType,
          sharedWithId: sharedWithId.trim(),
          permission,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to share');
      }

      toast({
        variant: 'success',
        title: 'Shared',
        description: `${resourceType === 'profile' ? 'Profile' : 'MCP Server'} shared successfully`,
      });

      setSharedWithId('');
      await fetchShares();
    } catch (err) {
      toast({
        variant: 'danger',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to share resource',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveShare = async (shareId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/sharing/${shareId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to remove share');
      }

      toast({
        variant: 'success',
        title: 'Removed',
        description: 'Share removed successfully',
      });

      await fetchShares();
    } catch {
      toast({
        variant: 'danger',
        title: 'Error',
        description: 'Failed to remove share',
      });
    }
  };

  const permissionLabel = (perm: string) => {
    switch (perm) {
      case 'read':
        return 'Read';
      case 'use':
        return 'Use';
      case 'admin':
        return 'Admin';
      default:
        return perm;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share {resourceType === 'profile' ? 'Profile' : 'MCP Server'}</DialogTitle>
          <DialogDescription>
            Share this resource with other users or organizations.
          </DialogDescription>
        </DialogHeader>

        {/* Current shares */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Current Shares</Label>
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : shares.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">Not shared with anyone yet.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {shares.map((share) => (
                <div
                  key={share.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-sm truncate">{share.sharedWithId}</span>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {share.sharedWithType}
                    </Badge>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {permissionLabel(share.permission)}
                    </Badge>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 shrink-0 text-destructive hover:text-destructive"
                    onClick={() => handleRemoveShare(share.id)}
                    aria-label="Remove share"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add new share form */}
        <div className="space-y-3 border-t pt-3">
          <Label className="text-sm font-medium">Add Share</Label>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">Share with</Label>
              <Select
                value={sharedWithType}
                onValueChange={(v) => {
                  setSharedWithType(v as 'user' | 'organization');
                  setSharedWithId('');
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User (email)</SelectItem>
                  <SelectItem value="organization">Organization</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Permission</Label>
              <Select value={permission} onValueChange={setPermission}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="use">Use</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {sharedWithType === 'user' ? (
            <Input
              placeholder="user@example.com"
              value={sharedWithId}
              onChange={(e) => setSharedWithId(e.target.value)}
            />
          ) : (
            <Select value={sharedWithId} onValueChange={setSharedWithId}>
              <SelectTrigger>
                <SelectValue placeholder="Select organization..." />
              </SelectTrigger>
              <SelectContent>
                {organizations.length === 0 ? (
                  <SelectItem value="_none" disabled>
                    No organizations available
                  </SelectItem>
                ) : (
                  organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            type="button"
            onClick={handleAddShare}
            disabled={submitting || !sharedWithId.trim()}
          >
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Share
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
