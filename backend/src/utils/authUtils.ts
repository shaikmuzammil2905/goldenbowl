import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const PASSWORD_SALT = process.env.PASSWORD_SALT || 'goldenbowl_password_salt_2026';

/**
 * Normalizes email address according to security best practices.
 * Converts to lowercase and trims leading/trailing whitespaces.
 */
export function normalizeEmail(email?: string | null): string {
  return String(email || '').trim().toLowerCase();
}

/**
 * Normalizes phone number to clean 10 digits.
 */
export function normalizePhone(phone?: string | null): string {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

/**
 * Hashes password using bcrypt with salt rounds = 12.
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}

/**
 * Verifies password against stored hash.
 * Supports:
 * 1. Standard bcrypt ($2a$, $2b$, $2y$)
 * 2. Legacy PBKDF2-SHA512 (128 hex chars)
 * 3. Legacy SHA-256 (64 hex chars)
 * 4. Plaintext fallback
 * Returns whether password is valid and whether the stored hash should be upgraded to bcrypt.
 */
export async function verifyPassword(
  plainPassword: string,
  storedHash: string | null | undefined
): Promise<{ valid: boolean; needsRehash: boolean }> {
  if (!storedHash || typeof storedHash !== 'string') {
    return { valid: false, needsRehash: false };
  }

  // 1. bcrypt check
  if (storedHash.startsWith('$2')) {
    const valid = await bcrypt.compare(plainPassword, storedHash);
    return { valid, needsRehash: false };
  }

  // 2. Legacy PBKDF2-SHA512 check
  try {
    const pbkdf2Hashed = crypto
      .pbkdf2Sync(plainPassword, PASSWORD_SALT, 10000, 64, 'sha512')
      .toString('hex');
    if (storedHash === pbkdf2Hashed) {
      return { valid: true, needsRehash: true };
    }
  } catch {}

  // 3. Legacy SHA-256 check
  try {
    const legacyHashed = crypto
      .createHash('sha256')
      .update(`${PASSWORD_SALT}:${plainPassword}`)
      .digest('hex');
    if (storedHash === legacyHashed) {
      return { valid: true, needsRehash: true };
    }
  } catch {}

  // 4. Plaintext fallback
  if (storedHash === plainPassword) {
    return { valid: true, needsRehash: true };
  }

  return { valid: false, needsRehash: false };
}
