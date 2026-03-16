/**
 * Better Auth Configuration
 *
 * Configures Better Auth with Prisma adapter, email+password (toggleable via
 * AUTH_EMAIL_PASSWORD env var), optional Google OAuth, Organization plugin,
 * and MCP OAuth plugin.
 * Auto-creates a default organization on user signup.
 */

import type { PrismaClient } from '@dxheroes/local-mcp-database/generated/prisma';
import { ConfigService } from '@nestjs/config';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { mcp } from 'better-auth/plugins';
import { organization } from 'better-auth/plugins/organization';
import { Resend } from 'resend';
import { resolveFrontendOrigin, resolveMcpLoginPageUrl } from './mcp-oauth.utils.js';

/**
 * Auth wrapper — simplified interface to avoid exporting Better Auth's deep generic types.
 */
export interface AuthInstance {
  handler: (req: Request) => Promise<Response>;
  api: {
    getSession: (opts: { headers: Headers }) => Promise<{
      user: { id: string; name: string; email: string; image: string | null };
      session: { id: string; userId: string; [key: string]: unknown };
    } | null>;
  };
}

/**
 * Generate a URL-safe slug from a name.
 */
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function createAuth(prisma: PrismaClient): AuthInstance {
  const hasGoogle = !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
  const emailPasswordEnabled = process.env.AUTH_EMAIL_PASSWORD !== 'false';
  const configService = new ConfigService();

  const auth = betterAuth({
    basePath: '/api/auth',
    baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3001',
    secret: process.env.BETTER_AUTH_SECRET,
    trustedOrigins: (process.env.CORS_ORIGINS?.split(',') || [
      'http://localhost:5173',
      'http://localhost:3000',
    ]),
    database: prismaAdapter(prisma, { provider: 'postgresql' }),
    emailAndPassword: { enabled: emailPasswordEnabled },
    ...(hasGoogle && {
      socialProviders: {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID ?? '',
          clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
        },
      },
    }),
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60, // 5 minutes
      },
    },
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            // 1. Auto-join organizations by email domain FIRST
            const emailDomain = user.email?.split('@')[1]?.toLowerCase();
            let autoJoinedCount = 0;

            if (emailDomain) {
              const matchingDomains = await prisma.organizationDomain.findMany({
                where: { domain: emailDomain },
                select: { organizationId: true },
              });

              for (const { organizationId } of matchingDomains) {
                const existing = await prisma.member.findFirst({
                  where: { organizationId, userId: user.id },
                });
                if (!existing) {
                  await prisma.member.create({
                    data: {
                      id: crypto.randomUUID(),
                      organizationId,
                      userId: user.id,
                      role: 'member',
                    },
                  });
                  autoJoinedCount++;
                }
              }
            }

            // 2. Fallback: create personal workspace only if no auto-join matched
            if (autoJoinedCount === 0) {
              const orgName = `${user.name}'s workspace`;
              const baseSlug = `${toSlug(user.name)}-workspace`;

              // Ensure unique slug
              let slug = baseSlug;
              let suffix = 0;
              while (true) {
                const existing = await prisma.organization.findUnique({ where: { slug } });
                if (!existing) break;
                suffix++;
                slug = `${baseSlug}-${suffix}`;
              }

              const orgId = crypto.randomUUID();
              const memberId = crypto.randomUUID();

              await prisma.organization.create({
                data: {
                  id: orgId,
                  name: orgName,
                  slug,
                },
              });

              await prisma.member.create({
                data: {
                  id: memberId,
                  organizationId: orgId,
                  userId: user.id,
                  role: 'owner',
                },
              });
            }

            // 3. Create default profile in the user's first organization
            const firstMembership = await prisma.member.findFirst({
              where: { userId: user.id },
              select: { organizationId: true },
            });
            if (firstMembership) {
              await prisma.profile.create({
                data: {
                  name: 'default',
                  description: 'Default MCP profile',
                  userId: user.id,
                  organizationId: firstMembership.organizationId,
                },
              });
            }
          },
        },
      },
    },
    plugins: [
      organization({
        sendInvitationEmail: async (data) => {
          const resendApiKey = process.env.RESEND_API_KEY;
          if (!resendApiKey) {
            console.warn('[auth] RESEND_API_KEY not set — skipping invitation email');
            return;
          }

          const resend = new Resend(resendApiKey);
          const frontendUrl = resolveFrontendOrigin(configService);
          const inviteUrl = `${frontendUrl}/invite/${data.invitation.id}`;
          const fromEmail = process.env.RESEND_FROM || 'Local MCP Gateway <noreply@example.com>';

          await resend.emails.send({
            from: fromEmail,
            to: data.email,
            subject: `You've been invited to join ${data.organization.name}`,
            text: [
              'Hi,',
              '',
              `${data.inviter.user.name} has invited you to join "${data.organization.name}" as a ${data.invitation.role}.`,
              '',
              'Accept the invitation:',
              inviteUrl,
              '',
              "If you don't have an account yet, you'll be asked to create one first.",
            ].join('\n'),
          });
        },
      }),
      mcp({
        loginPage: resolveMcpLoginPageUrl(configService),
      }),
    ],
  });
  return auth as unknown as AuthInstance;
}
