/**
 * Authentication Service
 *
 * Handles password hashing and JWT token generation/verification
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export class AuthService {
  private readonly saltRounds = 10;

  constructor(private jwtSecret: string) {
    if (!jwtSecret || jwtSecret.length < 32) {
      throw new Error('JWT secret must be at least 32 characters long');
    }
  }

  /**
   * Hash a password using bcrypt
   * @param password - Plain text password
   * @returns Hashed password
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Verify a password against a hash
   * @param password - Plain text password
   * @param hash - Hashed password
   * @returns True if password matches, false otherwise
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch {
      return false;
    }
  }

  /**
   * Generate a JWT token
   * @param userId - User ID
   * @param email - User email
   * @param expiresIn - Token expiration time (default: 7 days)
   * @returns JWT token
   */
  generateToken(userId: string, email: string, expiresIn: string = '7d'): string {
    return jwt.sign({ userId, email }, this.jwtSecret, { expiresIn: expiresIn as any });
  }

  /**
   * Verify and decode a JWT token
   * @param token - JWT token
   * @returns Decoded payload or null if invalid
   */
  verifyToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, this.jwtSecret) as JWTPayload;
    } catch {
      return null;
    }
  }

  /**
   * Decode a JWT token without verification (for debugging)
   * @param token - JWT token
   * @returns Decoded payload or null if invalid format
   */
  decodeToken(token: string): JWTPayload | null {
    try {
      return jwt.decode(token) as JWTPayload | null;
    } catch {
      return null;
    }
  }

  /**
   * Refresh a token (generate new token with same payload)
   * @param token - Existing JWT token
   * @param expiresIn - New expiration time
   * @returns New JWT token or null if invalid
   */
  refreshToken(token: string, expiresIn: string = '7d'): string | null {
    const payload = this.verifyToken(token);
    if (!payload) return null;

    return this.generateToken(payload.userId, payload.email, expiresIn);
  }
}
