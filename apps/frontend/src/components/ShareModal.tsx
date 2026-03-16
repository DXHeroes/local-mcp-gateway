/**
 * ShareModal Component
 *
 * Dialog for sharing profiles and MCP servers with organization members.
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
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useToast,
} from '@dxheroes/local-mcp-ui';
import { Building2, ChevronDown, Loader2, Trash2, User } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../lib/api-fetch';
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
  sharedBy?: { id: string; name: string; email: string };
  sharedWithUser?: { name: string; email: string };
  sharedWithOrganization?: { name: string };
}

interface OrgMember {
  id: string;
  userId: string;
  user: { name: string; email: string };
  role: string;
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceType: 'profile' | 'mcp_server';
  resourceId: string;
}

export default function ShareModal({ isOpen, onClose, resourceType, resourceId }: ShareModalProps) {
  const { toast } = useToast();
  const { data: activeOrg } = authClient.useActiveOrganization();
  const { data: session } = authClient.useSession();

  const [shares, setShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Org members state
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // Form state
  const [sharedWithType, setSharedWithType] = useState<'user' | 'organization'>('organization');
  const [sharedWithIds, setSharedWithIds] = useState<string[]>([]);
  const [sharedWithOrgId, setSharedWithOrgId] = useState('');
  const [permission, setPermission] = useState('use');

  const fetchShares = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiFetch(`/api/sharing/${resourceType}/${resourceId}`);
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

  const fetchMembers = useCallback(async () => {
    if (!activeOrg?.id) return;
    setMembersLoading(true);
    try {
      const result = await authClient.organization.listMembers({
        query: { organizationId: activeOrg.id },
      });
      const allMembers: OrgMember[] = Array.isArray(result.data) ? result.data : [];
      // Filter out the current user
      const currentUserId = session?.user?.id;
      setMembers(currentUserId ? allMembers.filter((m) => m.userId !== currentUserId) : allMembers);
    } catch {
      // Ignore errors
    } finally {
      setMembersLoading(false);
    }
  }, [activeOrg?.id, session?.user?.id]);

  useEffect(() => {
    if (isOpen) {
      fetchShares();
      fetchMembers();
      // Reset form
      setSharedWithType('organization');
      setSharedWithIds([]);
      setSharedWithOrgId(activeOrg?.id ?? '');
      setPermission('use');
    }
  }, [isOpen, fetchShares, fetchMembers, activeOrg?.id]);

  const handleAddShare = async () => {
    const ids =
      sharedWithType === 'organization' ? (sharedWithOrgId ? [sharedWithOrgId] : []) : sharedWithIds;

    if (ids.length === 0) {
      toast({
        variant: 'danger',
        title: 'Error',
        description:
          sharedWithType === 'organization'
            ? 'No active organization available'
            : 'Please select at least one member',
      });
      return;
    }

    setSubmitting(true);
    try {
      for (const id of ids) {
        const response = await apiFetch('/api/sharing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resourceType,
            resourceId,
            sharedWithType,
            sharedWithId: id,
            permission,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to share');
        }
      }

      const label = resourceType === 'profile' ? 'Profile' : 'MCP Server';
      const desc =
        sharedWithType === 'organization'
          ? `${label} shared with organization`
          : `${label} shared with ${ids.length} member${ids.length > 1 ? 's' : ''}`;

      toast({ variant: 'success', title: 'Shared', description: desc });

      setSharedWithIds([]);
      setSharedWithOrgId('');
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
      const response = await apiFetch(`/api/sharing/${shareId}`, {
        method: 'DELETE',
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

  const getShareDisplayName = (share: Share) => {
    if (share.sharedWithType === 'organization') {
      return share.sharedWithOrganization?.name || share.sharedWithId;
    }
    return share.sharedWithUser?.name || share.sharedWithUser?.email || share.sharedWithId;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share {resourceType === 'profile' ? 'Profile' : 'MCP Server'}</DialogTitle>
          <DialogDescription>
            Share this resource with organization members or entire organizations.
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
                    {share.sharedWithType === 'organization' ? (
                      <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className="text-sm truncate">{getShareDisplayName(share)}</span>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {share.sharedWithType === 'organization' ? 'Organization' : 'Member'}
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

          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">Share with</Label>
              <Select
                value={sharedWithType}
                onValueChange={(value: 'user' | 'organization') => {
                  setSharedWithType(value);
                  setSharedWithIds([]);
                  setSharedWithOrgId(value === 'organization' ? (activeOrg?.id ?? '') : '');
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Organization Member</SelectItem>
                  <SelectItem value="organization">Entire Organization</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">
                {sharedWithType === 'organization' ? 'Organization' : 'Members'}
              </Label>
              {sharedWithType === 'user' ? (
                membersLoading ? (
                  <div className="flex items-center justify-center py-2 mt-1">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="mt-1 flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span className={sharedWithIds.length === 0 ? 'text-muted-foreground' : ''}>
                          {sharedWithIds.length === 0
                            ? 'Select members...'
                            : `${sharedWithIds.length} member${sharedWithIds.length > 1 ? 's' : ''} selected`}
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-64 max-h-60 overflow-y-auto">
                      {members.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          No members available
                        </div>
                      ) : (
                        members.map((member) => (
                          <DropdownMenuCheckboxItem
                            key={member.userId}
                            checked={sharedWithIds.includes(member.userId)}
                            onSelect={(e) => e.preventDefault()}
                            onCheckedChange={(checked) => {
                              setSharedWithIds((prev) =>
                                checked
                                  ? [...prev, member.userId]
                                  : prev.filter((id) => id !== member.userId),
                              );
                            }}
                          >
                            {member.user.name} ({member.user.email})
                          </DropdownMenuCheckboxItem>
                        ))
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )
              ) : (
                <div className="mt-1 flex h-9 items-center rounded-md border bg-muted px-3 text-sm">
                  {activeOrg?.name ?? 'No active organization'}
                </div>
              )}
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
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            type="button"
            onClick={handleAddShare}
            disabled={
              submitting ||
              (sharedWithType === 'user' && sharedWithIds.length === 0) ||
              (sharedWithType === 'organization' && !sharedWithOrgId)
            }
          >
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Share
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
