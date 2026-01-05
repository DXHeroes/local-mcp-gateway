// Email templates
export { VerificationEmail } from './templates/verification-email.js';
export type { VerificationEmailProps } from './templates/verification-email.js';

export { PasswordResetEmail } from './templates/password-reset-email.js';
export type { PasswordResetEmailProps } from './templates/password-reset-email.js';

export { TwoFactorEnabledEmail } from './templates/two-factor-enabled-email.js';
export type { TwoFactorEnabledEmailProps } from './templates/two-factor-enabled-email.js';

// Reusable components
export { EmailLayout } from './components/email-layout.js';
export { EmailButton } from './components/email-button.js';
export { EmailFooter } from './components/email-footer.js';
export { EmailWarning } from './components/email-warning.js';

// Utilities
export { renderEmail, renderEmailText } from './utils/render-email.js';
