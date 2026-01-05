/**
 * Email Service with Resend + React Email
 *
 * Handles email sending for authentication flows using:
 * - Resend API for email delivery
 * - React Email for type-safe, professional templates
 */

import { Resend } from 'resend';
import {
  VerificationEmail,
  PasswordResetEmail,
  TwoFactorEnabledEmail,
  renderEmail,
} from '@dxheroes/local-mcp-emails';
import { logger } from './logger.js';

const EMAIL_FROM = process.env.EMAIL_FROM || 'Local MCP Gateway <noreply@local-mcp.dev>';

// Initialize Resend only if API key is provided
let resend: Resend | null = null;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
}

/**
 * Send verification email with verification link
 * @param to - Recipient email address
 * @param verificationUrl - URL for email verification
 * @param userName - Optional user name for personalization
 */
export async function sendVerificationEmail(
  to: string,
  verificationUrl: string,
  userName?: string
): Promise<void> {
  try {
    // Development mode: log to console instead of sending
    if (process.env.NODE_ENV === 'development') {
      logger.info('📧 [DEV MODE] Verification email (not sent):', {
        to,
        verificationUrl,
        userName,
      });
      return;
    }

    if (!resend) {
      throw new Error('Resend API key not configured. Set RESEND_API_KEY environment variable.');
    }

    const html = await renderEmail(
      VerificationEmail({ verificationUrl, userName })
    );

    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: 'Verify your email - Local MCP Gateway',
      html,
    });

    if (error) {
      logger.error('Failed to send verification email:', error);
      throw new Error(`Email sending failed: ${error.message}`);
    }

    logger.info('Verification email sent successfully', { emailId: data?.id, to });
  } catch (error) {
    logger.error('Failed to send verification email:', error);
    throw error instanceof Error ? error : new Error('Email sending failed');
  }
}

/**
 * Send password reset email with reset link
 * @param to - Recipient email address
 * @param resetUrl - URL for password reset
 * @param userName - Optional user name for personalization
 */
export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
  userName?: string
): Promise<void> {
  try {
    // Development mode: log to console instead of sending
    if (process.env.NODE_ENV === 'development') {
      logger.info('📧 [DEV MODE] Password reset email (not sent):', {
        to,
        resetUrl,
        userName,
      });
      return;
    }

    if (!resend) {
      throw new Error('Resend API key not configured. Set RESEND_API_KEY environment variable.');
    }

    const html = await renderEmail(
      PasswordResetEmail({ resetUrl, userName })
    );

    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: 'Reset your password - Local MCP Gateway',
      html,
    });

    if (error) {
      logger.error('Failed to send password reset email:', error);
      throw new Error(`Email sending failed: ${error.message}`);
    }

    logger.info('Password reset email sent successfully', { emailId: data?.id, to });
  } catch (error) {
    logger.error('Failed to send password reset email:', error);
    throw error instanceof Error ? error : new Error('Email sending failed');
  }
}

/**
 * Send 2FA enabled notification email
 * @param to - Recipient email address
 * @param userName - Optional user name for personalization
 */
export async function send2FAEnabledEmail(
  to: string,
  userName?: string
): Promise<void> {
  try {
    // Development mode: log to console instead of sending
    if (process.env.NODE_ENV === 'development') {
      logger.info('📧 [DEV MODE] 2FA enabled email (not sent):', {
        to,
        userName,
      });
      return;
    }

    if (!resend) {
      throw new Error('Resend API key not configured. Set RESEND_API_KEY environment variable.');
    }

    const html = await renderEmail(
      TwoFactorEnabledEmail({ userName })
    );

    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: 'Two-factor authentication enabled - Local MCP Gateway',
      html,
    });

    if (error) {
      logger.error('Failed to send 2FA enabled email:', error);
      throw new Error(`Email sending failed: ${error.message}`);
    }

    logger.info('2FA enabled email sent successfully', { emailId: data?.id, to });
  } catch (error) {
    logger.error('Failed to send 2FA enabled email:', error);
    throw error instanceof Error ? error : new Error('Email sending failed');
  }
}
