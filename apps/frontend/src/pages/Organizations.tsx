/**
 * Organizations Page
 *
 * Manage organizations, members, and invitations.
 */

import { Mail, Plus, Users } from 'lucide-react';
import { useState } from 'react';
import { authClient } from '../lib/auth-client';

export default function OrganizationsPage() {
  const { data: orgs, isPending: orgsLoading } = authClient.useListOrganizations();
  const { data: activeOrg } = authClient.useActiveOrganization();
  const [showCreate, setShowCreate] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgSlug, setNewOrgSlug] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'admin'>('member');

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
        {orgs && orgs.length > 0 ? (
          orgs.map((org) => (
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
        </div>
      )}
    </div>
  );
}
