import { Heading, Link, Section, Text } from '@react-email/components';
import { EmailButton } from '../components/email-button.js';
import { EmailFooter } from '../components/email-footer.js';
import { EmailLayout } from '../components/email-layout.js';
import { EmailWarning } from '../components/email-warning.js';

export interface VerificationEmailProps {
  verificationUrl: string;
  userName?: string;
}

export function VerificationEmail({
  verificationUrl,
  userName,
}: VerificationEmailProps) {
  const greeting = userName ? `Hi ${userName}` : 'Hello';

  return (
    <EmailLayout preview="Verify your email address">
      <Heading className="mb-6 text-2xl font-bold text-gray-900">
        Verify your email address
      </Heading>

      <Text className="mb-4 text-base text-gray-700">
        {greeting},
      </Text>

      <Text className="mb-6 text-base text-gray-700">
        Thank you for signing up for Local MCP Gateway. To complete your registration and start using your account, please verify your email address by clicking the button below:
      </Text>

      <Section className="mb-6 text-center">
        <EmailButton url={verificationUrl}>
          Verify Email Address
        </EmailButton>
      </Section>

      <Text className="mb-4 text-sm text-gray-600">
        If the button doesn't work, you can copy and paste this link into your browser:
      </Text>

      <Text className="mb-6 break-all text-sm text-blue-600">
        <Link href={verificationUrl} className="text-blue-600 underline">
          {verificationUrl}
        </Link>
      </Text>

      <EmailWarning type="info" title="Security Notice">
        This verification link will expire in 24 hours. If you didn't create an account with Local MCP Gateway, you can safely ignore this email.
      </EmailWarning>

      <EmailFooter />
    </EmailLayout>
  );
}

VerificationEmail.PreviewProps = {
  verificationUrl: 'https://local-mcp.dev/verify?token=abc123',
  userName: 'John Doe',
} as VerificationEmailProps;

export default VerificationEmail;
