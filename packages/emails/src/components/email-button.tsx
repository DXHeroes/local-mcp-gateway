import { Button } from '@react-email/components';

interface EmailButtonProps {
  url: string;
  children: string;
  variant?: 'primary' | 'danger';
}

export function EmailButton({ url, children, variant = 'primary' }: EmailButtonProps) {
  const styles = {
    primary: 'bg-indigo-600 hover:bg-indigo-700',
    danger: 'bg-red-600 hover:bg-red-700',
  };

  return (
    <Button
      href={url}
      className={`${styles[variant]} rounded-md px-6 py-3 text-base font-semibold text-white no-underline`}
    >
      {children}
    </Button>
  );
}
