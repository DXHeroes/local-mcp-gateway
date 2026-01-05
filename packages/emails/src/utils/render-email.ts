import { render } from '@react-email/render';
import type { ReactElement } from 'react';

/**
 * Render a React Email component to HTML string
 * @param component React Email component
 * @returns HTML string ready to send via email service
 */
export async function renderEmail(component: ReactElement): Promise<string> {
  return render(component, {
    pretty: false,
  });
}

/**
 * Render a React Email component to plain text
 * @param component React Email component
 * @returns Plain text version of the email
 */
export async function renderEmailText(component: ReactElement): Promise<string> {
  return render(component, {
    plainText: true,
  });
}
