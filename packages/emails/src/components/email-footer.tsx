import { Hr, Text } from '@react-email/components';

interface EmailFooterProps {
  text?: string;
  subtext?: string;
}

export function EmailFooter({
  text = 'Local MCP Gateway',
  subtext = 'This email was sent from your Local MCP Gateway installation.'
}: EmailFooterProps) {
  return (
    <>
      <Hr className="my-6 border-gray-200" />
      <Text className="text-xs text-gray-500">
        {text}
      </Text>
      {subtext && (
        <Text className="mt-2 text-xs text-gray-400">
          {subtext}
        </Text>
      )}
    </>
  );
}
