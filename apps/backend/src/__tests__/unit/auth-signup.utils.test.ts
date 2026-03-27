import { APIError } from 'better-auth/api';
import { describe, expect, it, vi } from 'vitest';
import {
  assertEmailPasswordSignupAllowed,
  getEmailPasswordSignupMode,
  getInvitationIdFromHeaders,
  INVITE_ONLY_SIGNUP_MESSAGE,
  SIGNUP_DISABLED_MESSAGE,
} from '../../modules/auth/auth-signup.utils.js';

function createPrismaMock(
  invitation: {
    email: string;
    expiresAt: Date;
    status: string;
  } | null = null
) {
  return {
    invitation: {
      findUnique: vi.fn().mockResolvedValue(invitation),
    },
  };
}

describe('auth-signup utils', () => {
  describe('getEmailPasswordSignupMode', () => {
    it('returns open by default', () => {
      expect(getEmailPasswordSignupMode({} as NodeJS.ProcessEnv)).toBe('open');
    });

    it('returns invite_only when configured', () => {
      expect(
        getEmailPasswordSignupMode({
          AUTH_EMAIL_PASSWORD_SIGNUP_MODE: 'invite_only',
        } as NodeJS.ProcessEnv)
      ).toBe('invite_only');
    });

    it('falls back to open for unknown values', () => {
      expect(
        getEmailPasswordSignupMode({
          AUTH_EMAIL_PASSWORD_SIGNUP_MODE: 'nope',
        } as NodeJS.ProcessEnv)
      ).toBe('open');
    });
  });

  describe('getInvitationIdFromHeaders', () => {
    it('reads and trims the invitation header', () => {
      const headers = new Headers({
        'x-invitation-id': '  invite-123  ',
      });

      expect(getInvitationIdFromHeaders(headers)).toBe('invite-123');
    });

    it('returns null when the header is missing', () => {
      expect(getInvitationIdFromHeaders(new Headers())).toBeNull();
    });
  });

  describe('assertEmailPasswordSignupAllowed', () => {
    it('allows open signup mode without querying invitations', async () => {
      const prisma = createPrismaMock();

      await expect(
        assertEmailPasswordSignupAllowed({
          prisma: prisma as never,
          signupMode: 'open',
          email: 'user@example.com',
          headers: new Headers(),
        })
      ).resolves.toBeUndefined();

      expect(prisma.invitation.findUnique).not.toHaveBeenCalled();
    });

    it('rejects closed signup mode', async () => {
      await expect(
        assertEmailPasswordSignupAllowed({
          prisma: createPrismaMock() as never,
          signupMode: 'closed',
          email: 'user@example.com',
          headers: new Headers(),
        })
      ).rejects.toMatchObject({
        message: SIGNUP_DISABLED_MESSAGE,
      } satisfies Partial<APIError>);
    });

    it('rejects invite-only signup without an invitation header', async () => {
      await expect(
        assertEmailPasswordSignupAllowed({
          prisma: createPrismaMock() as never,
          signupMode: 'invite_only',
          email: 'user@example.com',
          headers: new Headers(),
        })
      ).rejects.toMatchObject({
        message: INVITE_ONLY_SIGNUP_MESSAGE,
      } satisfies Partial<APIError>);
    });

    it('rejects invite-only signup when the invitation is not found', async () => {
      await expect(
        assertEmailPasswordSignupAllowed({
          prisma: createPrismaMock(null) as never,
          signupMode: 'invite_only',
          email: 'user@example.com',
          headers: new Headers({ 'x-invitation-id': 'invite-123' }),
        })
      ).rejects.toMatchObject({
        message: INVITE_ONLY_SIGNUP_MESSAGE,
      } satisfies Partial<APIError>);
    });

    it('rejects invite-only signup when the invitation email does not match', async () => {
      await expect(
        assertEmailPasswordSignupAllowed({
          prisma: createPrismaMock({
            email: 'other@example.com',
            expiresAt: new Date('2099-01-01T00:00:00.000Z'),
            status: 'pending',
          }) as never,
          signupMode: 'invite_only',
          email: 'user@example.com',
          headers: new Headers({ 'x-invitation-id': 'invite-123' }),
        })
      ).rejects.toMatchObject({
        message: INVITE_ONLY_SIGNUP_MESSAGE,
      } satisfies Partial<APIError>);
    });

    it('rejects invite-only signup when the invitation is expired', async () => {
      await expect(
        assertEmailPasswordSignupAllowed({
          prisma: createPrismaMock({
            email: 'user@example.com',
            expiresAt: new Date('2020-01-01T00:00:00.000Z'),
            status: 'pending',
          }) as never,
          signupMode: 'invite_only',
          email: 'user@example.com',
          headers: new Headers({ 'x-invitation-id': 'invite-123' }),
          now: new Date('2024-01-01T00:00:00.000Z'),
        })
      ).rejects.toMatchObject({
        message: INVITE_ONLY_SIGNUP_MESSAGE,
      } satisfies Partial<APIError>);
    });

    it('allows invite-only signup with a valid pending invitation', async () => {
      const prisma = createPrismaMock({
        email: 'User@Example.com',
        expiresAt: new Date('2099-01-01T00:00:00.000Z'),
        status: 'pending',
      });

      await expect(
        assertEmailPasswordSignupAllowed({
          prisma: prisma as never,
          signupMode: 'invite_only',
          email: ' user@example.com ',
          headers: new Headers({ 'x-invitation-id': 'invite-123' }),
          now: new Date('2024-01-01T00:00:00.000Z'),
        })
      ).resolves.toBeUndefined();

      expect(prisma.invitation.findUnique).toHaveBeenCalledWith({
        where: { id: 'invite-123' },
        select: {
          email: true,
          expiresAt: true,
          status: true,
        },
      });
    });
  });
});
