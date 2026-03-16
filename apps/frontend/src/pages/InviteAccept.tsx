/**
 * Invitation Acceptance Page
 *
 * Consent screen for accepting or declining an organization invitation.
 * Accessible at /invite/:invitationId — bypasses OrgGate since the user
 * may not belong to any organization yet.
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { authClient } from '../lib/auth-client';

interface InvitationDetails {
  id: string;
  organizationName: string;
  organizationSlug: string;
  inviterName: string;
  role: string;
  status: string;
  email: string;
}

export default function InviteAcceptPage() {
  const { invitationId } = useParams<{ invitationId: string }>();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<'accept' | 'decline' | null>(null);
  const [declined, setDeclined] = useState(false);

  const fetchInvitation = useCallback(async () => {
    if (!invitationId) {
      setError('Invalid invitation link.');
      setLoading(false);
      return;
    }

    try {
      const result = await authClient.organization.getInvitation({
        query: { id: invitationId },
      });

      if (result.error) {
        setError(result.error.message || 'Failed to load invitation.');
        setLoading(false);
        return;
      }

      const inv = result.data;
      if (!inv) {
        setError('Invitation not found.');
        setLoading(false);
        return;
      }

      if (inv.status === 'accepted') {
        setError('This invitation has already been accepted.');
        setLoading(false);
        return;
      }

      if (inv.status === 'rejected') {
        setError('This invitation has been declined.');
        setLoading(false);
        return;
      }

      if (inv.status === 'canceled') {
        setError('This invitation has been canceled.');
        setLoading(false);
        return;
      }

      setInvitation({
        id: inv.id,
        organizationName: inv.organizationName,
        organizationSlug: inv.organizationSlug,
        inviterName: inv.inviterEmail,
        role: inv.role,
        status: inv.status,
        email: inv.email,
      });
    } catch {
      setError('Failed to load invitation. It may be expired or invalid.');
    } finally {
      setLoading(false);
    }
  }, [invitationId]);

  useEffect(() => {
    fetchInvitation();
  }, [fetchInvitation]);

  const handleAccept = async () => {
    if (!invitationId) return;
    setActionLoading('accept');
    setError('');

    try {
      const result = await authClient.organization.acceptInvitation({
        invitationId,
      });

      if (result.error) {
        setError(result.error.message || 'Failed to accept invitation.');
        setActionLoading(null);
        return;
      }

      navigate('/');
    } catch {
      setError('Failed to accept invitation. Please try again.');
      setActionLoading(null);
    }
  };

  const handleDecline = async () => {
    if (!invitationId) return;
    setActionLoading('decline');
    setError('');

    try {
      const result = await authClient.organization.rejectInvitation({
        invitationId,
      });

      if (result.error) {
        setError(result.error.message || 'Failed to decline invitation.');
        setActionLoading(null);
        return;
      }

      setDeclined(true);
    } catch {
      setError('Failed to decline invitation. Please try again.');
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading invitation...</div>
      </div>
    );
  }

  if (declined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Invitation Declined</h2>
          <p className="text-gray-500 text-sm mb-6">
            You have declined the invitation to join{' '}
            <span className="font-medium text-gray-700">{invitation?.organizationName}</span>.
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Invitation Error</h2>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (!invitation) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
        <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
          Organization Invitation
        </h2>
        <p className="text-gray-500 text-sm text-center mb-6">
          You have been invited to join{' '}
          <span className="font-medium text-gray-900">{invitation.organizationName}</span> as a{' '}
          <span className="font-medium text-gray-900">{invitation.role}</span>.
        </p>
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Organization</dt>
              <dd className="font-medium text-gray-900">{invitation.organizationName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Role</dt>
              <dd className="font-medium text-gray-900 capitalize">{invitation.role}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Invited by</dt>
              <dd className="font-medium text-gray-900">{invitation.inviterName}</dd>
            </div>
          </dl>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleDecline}
            disabled={actionLoading !== null}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading === 'decline' ? 'Declining...' : 'Decline'}
          </button>
          <button
            type="button"
            onClick={handleAccept}
            disabled={actionLoading !== null}
            className="flex-1 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading === 'accept' ? 'Accepting...' : 'Accept Invitation'}
          </button>
        </div>
      </div>
    </div>
  );
}
