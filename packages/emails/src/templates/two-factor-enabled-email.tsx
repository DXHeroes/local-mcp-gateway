import { Heading, Text } from '@react-email/components';
import { EmailFooter } from '../components/email-footer.js';
import { EmailLayout } from '../components/email-layout.js';
import { EmailWarning } from '../components/email-warning.js';

export interface TwoFactorEnabledEmailProps {
  userName?: string;
}

export function TwoFactorEnabledEmail({
  userName,
}: TwoFactorEnabledEmailProps) {
  const greeting = userName ? `Hi ${userName}` : 'Hello';

  return (
    <EmailLayout preview="Two-factor authentication enabled">
      <Heading className="mb-6 text-2xl font-bold text-gray-900">
        Two-factor authentication enabled
      </Heading>

      <Text className="mb-4 text-base text-gray-700">
        {greeting},
      </Text>

      <Text className="mb-6 text-base text-gray-700">
        Two-factor authentication (2FA) has been successfully enabled on your Local MCP Gateway account. From now on, you'll need to enter a verification code from your authenticator app when signing in.
      </Text>

      <EmailWarning type="info" title="Enhanced Security">
        Your account is now more secure. Even if someone gets your password, they won't be able to access your account without access to your authenticator app.
      </EmailWarning>

      <Text className="mt-6 text-sm text-gray-600">
        No action is required on your part. This is just a confirmation that 2FA has been enabled.
      </Text>

      <Text className="mb-6 text-sm text-gray-600">
        If you didn't enable two-factor authentication, please contact support immediately as your account may be compromised.
      </Text>

      <EmailFooter />
    </EmailLayout>
  );
}

TwoFactorEnabledEmail.PreviewProps = {
  userName: 'Alex Johnson',
} as TwoFactorEnabledEmailProps;

export default TwoFactorEnabledEmail;
