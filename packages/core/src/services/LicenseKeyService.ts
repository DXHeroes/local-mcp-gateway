/**
 * License Key Service
 *
 * Handles license key generation and validation using Ed25519 signatures
 */

import { sign, verify } from '@noble/ed25519';
import { createHash } from 'crypto';

export interface LicensePayload {
  v: number; // Version
  lid: string; // License ID
  tid: string; // Tier ID ('startup' | 'business' | 'enterprise')
  oid?: string; // Organization ID (optional)
  lim: {
    // Limits
    u?: number; // Max users
    p?: number; // Max profiles
    s?: number; // Max servers
    a: number; // Max activations
  };
  fea: string[]; // Feature codes
  iat: number; // Issued at (Unix timestamp)
  exp?: number; // Expires at (Unix timestamp, optional)
}

export interface LicenseValidationResult {
  valid: boolean;
  payload?: LicensePayload;
  reason?: 'invalid_signature' | 'expired' | 'parse_error' | 'invalid_format';
}

export class LicenseKeyService {
  constructor(
    private privateKeyHex: string,
    private publicKeyHex: string
  ) {
    if (!privateKeyHex || privateKeyHex.length !== 64) {
      throw new Error('Private key must be 64 hex characters (32 bytes)');
    }
    if (!publicKeyHex || publicKeyHex.length !== 64) {
      throw new Error('Public key must be 64 hex characters (32 bytes)');
    }
  }

  /**
   * Generate a license key
   * @param payload - License payload
   * @returns Display key and key hash for storage
   */
  async generateLicenseKey(payload: LicensePayload): Promise<{
    displayKey: string;
    keyHash: string;
    keyPrefix: string;
  }> {
    // Sign payload
    const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
    const privateKey = this.hexToBytes(this.privateKeyHex);
    const signature = await sign(payloadBytes, privateKey);

    // Create signed payload (base64url encoded)
    const payloadBase64 = this.base64UrlEncode(payloadBytes);
    const signatureBase64 = this.base64UrlEncode(signature);
    const signedPayload = `${payloadBase64}.${signatureBase64}`;

    // Format as display key
    const displayKey = this.formatDisplayKey(signedPayload, payload.tid);

    // Hash for storage (SHA-256)
    const keyHash = this.hashKey(displayKey);

    // Extract prefix (first 8 chars after LMG-)
    const keyPrefix = displayKey.split('-')[1] || '';

    return { displayKey, keyHash, keyPrefix };
  }

  /**
   * Validate a license key
   * @param displayKey - License key in display format
   * @returns Validation result with payload if valid
   */
  async validateLicenseKey(displayKey: string): Promise<LicenseValidationResult> {
    try {
      // Parse display key back to signed payload
      const signedPayload = this.parseDisplayKey(displayKey);
      if (!signedPayload) {
        return { valid: false, reason: 'invalid_format' };
      }

      const parts = signedPayload.split('.');
      if (parts.length !== 2) {
        return { valid: false, reason: 'invalid_format' };
      }

      const payloadBase64 = parts[0];
      const signatureBase64 = parts[1];

      if (!payloadBase64 || !signatureBase64) {
        return { valid: false, reason: 'invalid_format' };
      }

      // Decode
      const payloadBytes = this.base64UrlDecode(payloadBase64);
      const signature = this.base64UrlDecode(signatureBase64);
      const publicKey = this.hexToBytes(this.publicKeyHex);

      // Verify signature
      const isValid = await verify(signature, payloadBytes, publicKey);
      if (!isValid) {
        return { valid: false, reason: 'invalid_signature' };
      }

      // Parse payload
      const payload = JSON.parse(new TextDecoder().decode(payloadBytes)) as LicensePayload;

      // Check expiration
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        return { valid: false, reason: 'expired', payload };
      }

      return { valid: true, payload };
    } catch {
      return { valid: false, reason: 'parse_error' };
    }
  }

  /**
   * Hash a license key for storage
   * @param displayKey - License key in display format
   * @returns SHA-256 hash (hex string)
   */
  hashKey(displayKey: string): string {
    return createHash('sha256').update(displayKey).digest('hex');
  }

  /**
   * Format signed payload as display key
   * Format: LMG-{TIER}-{PART1}-{PART2}-{PART3}-{PART4}-{CHECK}
   * @param signedPayload - Base64url encoded signed payload
   * @param tier - Tier ID
   * @returns Display key
   */
  private formatDisplayKey(signedPayload: string, tier: string): string {
    // Encode as base32 (more human-readable than base64)
    const encoded = this.base32Encode(signedPayload);

    // Split into 5-character parts
    const parts: string[] = [];
    for (let i = 0; i < encoded.length; i += 5) {
      parts.push(encoded.slice(i, i + 5).padEnd(5, 'X'));
    }

    // Take first 4 parts
    const keyParts = parts.slice(0, 4);

    // Generate checksum (CRC32 of signed payload, last 4 hex chars)
    const checksum = this.crc32(signedPayload)
      .toString(16)
      .toUpperCase()
      .padStart(8, '0')
      .slice(-4);

    // Tier prefix
    const tierPrefix =
      tier === 'startup'
        ? 'STR'
        : tier === 'business'
          ? 'BUS'
          : tier === 'enterprise'
            ? 'ENT'
            : 'UNK';

    return `LMG-${tierPrefix}-${keyParts.join('-')}-${checksum}`;
  }

  /**
   * Parse display key back to signed payload
   * @param displayKey - License key in display format
   * @returns Base64url encoded signed payload or null if invalid
   */
  private parseDisplayKey(displayKey: string): string | null {
    try {
      // Expected format: LMG-{TIER}-{PART1}-{PART2}-{PART3}-{PART4}-{CHECK}
      const parts = displayKey.split('-');
      if (parts.length !== 7 || parts[0] !== 'LMG') {
        return null;
      }

      // Reconstruct base32 encoded string
      const keyParts = parts.slice(2, 6).join('');

      // Decode from base32
      const signedPayload = this.base32Decode(keyParts);

      // Verify checksum
      const expectedChecksum = parts[6];
      if (!expectedChecksum) return null;

      const actualChecksum = this.crc32(signedPayload)
        .toString(16)
        .toUpperCase()
        .padStart(8, '0')
        .slice(-4);
      if (expectedChecksum !== actualChecksum) {
        return null;
      }

      return signedPayload;
    } catch {
      return null;
    }
  }

  // ===== Helper methods =====

  private hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
    }
    return bytes;
  }

  private base64UrlEncode(bytes: Uint8Array): string {
    const base64 = Buffer.from(bytes).toString('base64');
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  private base64UrlDecode(str: string): Uint8Array {
    // Add padding
    str = str + '==='.slice((str.length + 3) % 4);
    // Replace URL-safe chars
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    return new Uint8Array(Buffer.from(str, 'base64'));
  }

  private base32Encode(str: string): string {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removes I, O, 0, 1, L (confusable)
    const bytes = new TextEncoder().encode(str);
    let bits = 0;
    let value = 0;
    let output = '';

    for (let i = 0; i < bytes.length; i++) {
      const byte = bytes[i];
      if (byte === undefined) continue;
      value = (value << 8) | byte;
      bits += 8;

      while (bits >= 5) {
        output += alphabet[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }

    if (bits > 0) {
      output += alphabet[(value << (5 - bits)) & 31];
    }

    return output;
  }

  private base32Decode(str: string): string {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let bits = 0;
    let value = 0;
    const output: number[] = [];

    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if (!char || char === 'X') continue; // Skip padding

      const index = alphabet.indexOf(char);
      if (index === -1) throw new Error('Invalid base32 character');

      value = (value << 5) | index;
      bits += 5;

      if (bits >= 8) {
        output.push((value >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }

    return new TextDecoder().decode(new Uint8Array(output));
  }

  private crc32(str: string): number {
    const bytes = new TextEncoder().encode(str);
    let crc = 0xffffffff;

    for (let i = 0; i < bytes.length; i++) {
      const byte = bytes[i];
      if (byte === undefined) continue;
      crc ^= byte;
      for (let j = 0; j < 8; j++) {
        crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
      }
    }

    return (crc ^ 0xffffffff) >>> 0;
  }
}
