/**
 * Organizations Page
 *
 * Manage organizations, members, and invitations.
 */

import { Globe, Mail, Plus, Trash2, Users, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../lib/api-fetch';
import { authClient } from '../lib/auth-client';

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  inviterId: string;
  expiresAt: Date;
  createdAt: Date;
}

export default function OrganizationsPage() {
  const { data: orgs, isPending: orgsLoading } = authClient.useListOrganizations();
  const { data: activeOrg } = authClient.useActiveOrganization();
  const organizations = Array.isArray(orgs) ? orgs : [];
  const [showCreate, setShowCreate] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgSlug, setNewOrgSlug] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'admin'>('member');
  const [domains, setDomains] = useState<{ id: string; domain: string }[]>([]);
  const [showDomainForm, setShowDomainForm] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [domainError, setDomainError] = useState('');
  const [members, setMembers] = useState<
    { id: string; userId: string; user: { name: string; email: string }; role: string }[]
  >([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [invitationsLoading, setInvitationsLoading] = useState(false);
  const { data: session } = authClient.useSession();

  const currentUserRole = members.find((m) => m.userId === session?.user?.id)?.role;
  const canChangeRoles = currentUserRole === 'owner' || currentUserRole === 'admin';

  const handleRoleChange = async (memberId: string, newRole: string) => {
    if (!activeOrg) return;
    await authClient.organization.updateMemberRole({
      memberId,
      role: newRole,
      organizationId: activeOrg.id,
    });
    fetchMembers();
  };

  const fetchMembers = useCallback(async () => {
    if (!activeOrg?.id) return;
    setMembersLoading(true);
    try {
      const result = await authClient.organization.listMembers({
        query: { organizationId: activeOrg.id },
      });
      setMembers(Array.isArray(result.data) ? result.data : []);
    } catch {
      // ignore
    } finally {
      setMembersLoading(false);
    }
  }, [activeOrg?.id]);

  const fetchInvitations = useCallback(async () => {
    if (!activeOrg?.id) return;
    setInvitationsLoading(true);
    try {
      const result = await authClient.organization.listInvitations({
        query: { organizationId: activeOrg.id },
      });
      const all = Array.isArray(result.data) ? result.data : [];
      setInvitations(all.filter((inv: Invitation) => inv.status === 'pending'));
    } catch {
      // ignore
    } finally {
      setInvitationsLoading(false);
    }
  }, [activeOrg?.id]);

  useEffect(() => {
    fetchMembers();
    fetchInvitations();
  }, [fetchMembers, fetchInvitations]);

  const fetchDomains = useCallback(async () => {
    if (!activeOrg) return;
    try {
      const res = await apiFetch('/api/organization-domains');
      if (res.ok) {
        setDomains(await res.json());
      }
    } catch {
      // ignore
    }
  }, [activeOrg]);

  useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

  const handleAddDomain = async () => {
    if (!newDomain.trim()) return;
    const res = await apiFetch('/api/organization-domains', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: newDomain }),
    });
    if (res.ok) {
      setNewDomain('');
      setDomainError('');
      setShowDomainForm(false);
      fetchDomains();
    } else {
      const body = await res.json().catch(() => null);
      setDomainError(body?.message || 'Failed to add domain');
    }
  };

  const handleRemoveDomain = async (id: string) => {
    const res = await apiFetch(`/api/organization-domains/${id}`, { method: 'DELETE' });
    if (res.ok) {
      fetchDomains();
    }
  };

  const handleCreateOrg = async () => {
    if (!newOrgName.trim()) return;
    await authClient.organization.create({
      name: newOrgName,
      slug: newOrgSlug || newOrgName.toLowerCase().replace(/\s+/g, '-'),
    });
    setNewOrgName('');
    setNewOrgSlug('');
    setShowCreate(false);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !activeOrg) return;
    await authClient.organization.inviteMember({
      email: inviteEmail,
      role: inviteRole,
      organizationId: activeOrg.id,
    });
    setInviteEmail('');
    setShowInvite(false);
    fetchMembers();
    fetchInvitations();
  };

  const handleCancelInvitation = async (invitationId: string) => {
    await authClient.organization.cancelInvitation({ invitationId });
    fetchInvitations();
  };

  const handleSetActive = async (orgId: string) => {
    await authClient.organization.setActive({ organizationId: orgId });
  };

  if (orgsLoading) {
    return <div className="p-4 text-gray-500">Loading organizations...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Organizations</h2>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Create Organization
        </button>
      </div>

      {showCreate && (
        <div className="bg-white border rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-medium text-gray-900">New Organization</h3>
          <input
            type="text"
            placeholder="Organization name"
            value={newOrgName}
            onChange={(e) => setNewOrgName(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
          <input
            type="text"
            placeholder="Slug (optional)"
            value={newOrgSlug}
            onChange={(e) => setNewOrgSlug(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCreateOrg}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 border rounded-lg text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {organizations.length > 0 ? (
          organizations.map((org) => (
            <div key={org.id} className="bg-white border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-gray-400" />
                  <div>
                    <h3 className="font-medium text-gray-900">{org.name}</h3>
                    <p className="text-sm text-gray-500">{org.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {activeOrg?.id === org.id ? (
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                      Active
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetActive(org.id)}
                      className="text-xs px-3 py-1 border rounded-lg hover:bg-gray-50"
                    >
                      Set Active
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-sm">No organizations yet. Create one to get started.</p>
        )}
      </div>

      {activeOrg && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Members of {activeOrg.name}</h3>
            <button
              type="button"
              onClick={() => setShowInvite(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50"
            >
              <Mail className="w-4 h-4" />
              Invite
            </button>
          </div>

          {showInvite && (
            <div className="bg-white border rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-medium text-gray-900">Invite Member</h3>
              <input
                type="email"
                placeholder="Email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'member' | 'admin')}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleInvite}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm"
                >
                  Send Invite
                </button>
                <button
                  type="button"
                  onClick={() => setShowInvite(false)}
                  className="px-4 py-2 border rounded-lg text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {membersLoading ? (
            <p className="text-sm text-gray-500">Loading members...</p>
          ) : members.length > 0 ? (
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between bg-white border rounded-lg px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                      {member.user.name?.[0]?.toUpperCase() || member.user.email?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{member.user.name}</p>
                      <p className="text-xs text-gray-500">{member.user.email}</p>
                    </div>
                  </div>
                  {canChangeRoles &&
                  member.userId !== session?.user?.id &&
                  member.role !== 'owner' ? (
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded-full font-medium border-none cursor-pointer appearance-none bg-no-repeat bg-[length:12px] bg-[right_4px_center] pr-5 ${
                        member.role === 'admin'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                      style={{
                        backgroundImage:
                          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
                      }}
                    >
                      <option value="member">member</option>
                      <option value="admin">admin</option>
                    </select>
                  ) : (
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        member.role === 'owner'
                          ? 'bg-green-100 text-green-700'
                          : member.role === 'admin'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {member.role}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No members found.</p>
          )}

          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900">Pending Invitations</h3>
              {invitations.length > 0 && (
                <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full font-medium">
                  {invitations.length}
                </span>
              )}
            </div>

            {invitationsLoading ? (
              <p className="text-sm text-gray-500">Loading invitations...</p>
            ) : invitations.length > 0 ? (
              <div className="space-y-2">
                {invitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between bg-white border rounded-lg px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-sm font-medium text-yellow-700">
                        {inv.email[0]?.toUpperCase() || '?'}
                      </div>
                      <p className="text-sm font-medium text-gray-900">{inv.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          inv.role === 'admin'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {inv.role || 'member'}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full font-medium bg-yellow-100 text-yellow-700">
                        pending
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCancelInvitation(inv.id)}
                        className="text-gray-400 hover:text-red-500 ml-1"
                        title="Cancel invitation"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No pending invitations.</p>
            )}
          </div>

          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900">Auto-Join Domains</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDomainForm(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50"
              >
                <Plus className="w-4 h-4" />
                Add Domain
              </button>
            </div>
            <p className="text-sm text-gray-500">
              New users signing up with an email from these domains will automatically join this
              organization as a member.
            </p>

            {showDomainForm && (
              <div className="bg-white border rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-medium text-gray-900">Add Domain</h3>
                <input
                  type="text"
                  placeholder="e.g. dxheroes.io"
                  value={newDomain}
                  onChange={(e) => {
                    setNewDomain(e.target.value);
                    setDomainError('');
                  }}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
                {domainError && (
                  <p className="text-sm text-red-600">{domainError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAddDomain}
                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDomainForm(false);
                      setDomainError('');
                    }}
                    className="px-4 py-2 border rounded-lg text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {domains.length > 0 ? (
              <div className="space-y-2">
                {domains.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between bg-white border rounded-lg px-4 py-2"
                  >
                    <span className="text-sm text-gray-900">{d.domain}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDomain(d.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No auto-join domains configured.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
