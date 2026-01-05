/**
 * Better Auth Session Middleware
 *
 * Provides authentication middleware using better-auth sessions instead of JWT
 */

import type { Request, Response, NextFunction } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../lib/auth.js';

export interface AuthRequest extends Request {
  session?: {
    user: {
      id: string;
      email: string;
      name: string;
      emailVerified: boolean;
      image?: string | null;
      createdAt: Date;
    };
    session: {
      id: string;
      userId: string;
      expiresAt: Date;
      ipAddress?: string | null;
      userAgent?: string | null;
    };
  };
  user?: {
    userId: string;
    email: string;
  };
}

/**
 * Require authentication - reject requests without valid session
 */
export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      res.status(401).json({ error: 'Unauthorized - Authentication required' });
      return;
    }

    req.session = session;

    // Backward compatibility: set req.user for existing code
    req.user = {
      userId: session.user.id,
      email: session.user.email,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Invalid or expired session' });
  }
}

/**
 * Optional authentication - attach session if available, but don't reject
 */
export async function optionalAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (session) {
      req.session = session;

      // Backward compatibility
      req.user = {
        userId: session.user.id,
        email: session.user.email,
      };
    }

    next();
  } catch {
    // Ignore errors in optional auth
    next();
  }
}

/**
 * Require email verification
 */
export async function requireEmailVerified(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (!req.session.user.emailVerified) {
    res
      .status(403)
      .json({ error: 'Email verification required', code: 'EMAIL_NOT_VERIFIED' });
    return;
  }

  next();
}
