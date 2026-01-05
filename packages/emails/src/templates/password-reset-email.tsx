import { Heading, Link, Section, Text } from '@react-email/components';
import { EmailButton } from '../components/email-button.js';
import { EmailFooter } from '../components/email-footer.js';
import { EmailLayout } from '../components/email-layout.js';
import { EmailWarning } from '../components/email-warning.js';

export interface PasswordResetEmailProps {
  resetUrl: string;
  userName?: string;
}

export function PasswordResetEmail({
  resetUrl,
  userName,
}: PasswordResetEmailProps) {
  const greeting = userName ? `Hi ${userName}` : 'Hello';

  return (
    <EmailLayout preview="Reset your password">
      <Heading className="mb-6 text-2xl font-bold text-gray-900">
        Reset your password
      </Heading>

      <Text className="mb-4 text-base text-gray-700">
        {greeting},
      </Text>

      <Text className="mb-6 text-base text-gray-700">
        We received a request to reset your password for your Local MCP Gateway account. Click the button below to choose a new password:
      </Text>

      <Section className="mb-6 text-center">
        <EmailButton url={resetUrl} variant="danger">
          Reset Password
        </EmailButton>
      </Section>

      <Text className="mb-4 text-sm text-gray-600">
        If the button doesn't work, you can copy and paste this link into your browser:
      </Text>

      <Text className="mb-6 break-all text-sm text-blue-600">
        <Link href={resetUrl} className="text-blue-600 underline">
          {resetUrl}
        </Link>
      </Text>

      <EmailWarning type="warning" title="Important">
        This password reset link will expire in 1 hour for security reasons. If you didn't request a password reset, please ignore this email or contact support if you have concerns about your account security.
      </EmailWarning>

      <EmailFooter />
    </EmailLayout>
  );
}

PasswordResetEmail.PreviewProps = {
  resetUrl: 'https://local-mcp.dev/reset-password?token=xyz789',
  userName: 'Jane Smith',
} as PasswordResetEmailProps;

export default PasswordResetEmail;
