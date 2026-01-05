import { Section, Text } from '@react-email/components';
import type { ReactNode } from 'react';

interface EmailWarningProps {
  type?: 'warning' | 'info';
  title?: string;
  children: ReactNode;
}

export function EmailWarning({ type = 'info', title, children }: EmailWarningProps) {
  const styles = {
    warning: {
      border: 'border-l-4 border-red-500',
      bg: 'bg-red-50',
      title: 'text-red-900',
      text: 'text-red-800'
    },
    info: {
      border: 'border-l-4 border-blue-500',
      bg: 'bg-blue-50',
      title: 'text-blue-900',
      text: 'text-blue-800'
    },
  };

  const style = styles[type];

  return (
    <Section className={`${style.border} ${style.bg} my-4 rounded-r-md p-4`}>
      {title && (
        <Text className={`${style.title} mb-1 text-sm font-semibold`}>
          {title}
        </Text>
      )}
      <Text className={`${style.text} text-sm`}>
        {children}
      </Text>
    </Section>
  );
}
