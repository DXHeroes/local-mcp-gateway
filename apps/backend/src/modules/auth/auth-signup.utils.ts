import type { PrismaClient } from '@dxheroes/local-mcp-database/generated/prisma';
import { APIError } from 'better-auth/api';

export const EMAIL_PASSWORD_SIGNUP_MODES = ['open', 'invite_only', 'closed'] as const;

export type EmailPasswordSignupMode = (typeof EMAIL_PASSWORD_SIGNUP_MODES)[number];

export const INVITE_ONLY_SIGNUP_MESSAGE = 'Account creation is by invitation only.';
export const SIGNUP_DISABLED_MESSAGE = 'Account creation is disabled.';

export function getEmailPasswordSignupMode(
  env: NodeJS.ProcessEnv = process.env
): EmailPasswordSignupMode {
  const mode = env.AUTH_EMAIL_PASSWORD_SIGNUP_MODE?.trim().toLowerCase();

  if (mode && EMAIL_PASSWORD_SIGNUP_MODES.includes(mode as EmailPasswordSignupMode)) {
    return mode as EmailPasswordSignupMode;
  }

  return 'open';
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function getInvitationIdFromHeaders(headers: Headers): string | null {
  const invitationId = headers.get('x-invitation-id')?.trim();
  return invitationId ? invitationId : null;
}

interface AssertEmailPasswordSignupAllowedOptions {
  prisma: PrismaClient;
  signupMode: EmailPasswordSignupMode;
  email: string;
  headers: Headers;
  now?: Date;
}

export async function assertEmailPasswordSignupAllowed({
  prisma,
  signupMode,
  email,
  headers,
  now = new Date(),
}: AssertEmailPasswordSignupAllowedOptions): Promise<void> {
  if (signupMode === 'open') {
    return;
  }

  if (signupMode === 'closed') {
    throw new APIError('BAD_REQUEST', {
      message: SIGNUP_DISABLED_MESSAGE,
    });
  }

  const invitationId = getInvitationIdFromHeaders(headers);
  if (!invitationId) {
    throw new APIError('BAD_REQUEST', {
      message: INVITE_ONLY_SIGNUP_MESSAGE,
    });
  }

  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
    select: {
      email: true,
      expiresAt: true,
      status: true,
    },
  });

  if (
    !invitation ||
    invitation.status !== 'pending' ||
    invitation.expiresAt <= now ||
    normalizeEmail(invitation.email) !== normalizeEmail(email)
  ) {
    throw new APIError('BAD_REQUEST', {
      message: INVITE_ONLY_SIGNUP_MESSAGE,
    });
  }
}
