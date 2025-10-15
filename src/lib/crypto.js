/**
 * @fileoverview Cryptographic utilities for data encryption and decryption.
 *
 * Provides AES-256-CBC encryption and decryption functions for securing sensitive data.
 * Uses a key derivation function to ensure proper key length and supports both hex
 * and string-based encryption keys. Essential for protecting sensitive information
 * like API keys, tokens, or other confidential data.
 *
 * Security features:
 * - AES-256-CBC encryption algorithm
 * - Random IV generation for each encryption
 * - SHA-256 key derivation for non-hex keys
 * - Proper error handling and logging
 *
 * @example
 * ```js
 * import { encrypt, decrypt } from '@/lib/crypto';
 *
 * // Environment setup
 * process.env.ENCRYPTION_SECRET = 'your-secret-key-here';
 *
 * // Encrypt sensitive data
 * const encrypted = encrypt('my-secret-api-key');
 * console.log(encrypted); // 'iv-hex-string:encrypted-data-hex'
 *
 * // Decrypt data
 * const decrypted = decrypt(encrypted);
 * console.log(decrypted); // 'my-secret-api-key'
 * ```
 */

// src/lib/crypto.js
import crypto from 'crypto';

/**
 * Encryption algorithm used for data protection.
 * @constant {string}
 */
const ALGORITHM = 'aes-256-cbc';

/**
 * Length of initialization vector in bytes.
 * Standard length for AES encryption.
 * @constant {number}
 */
const IV_LENGTH = 16;

/**
 * Derives a 32-byte encryption key from the provided secret.
 *
 * Supports two input formats:
 * 1. 64-character hex string (32 bytes) - used directly
 * 2. Any other string - hashed with SHA-256 to derive 32-byte key
 *
 * This ensures the key is always the correct length for AES-256 encryption
 * while providing flexibility in key format.
 *
 * @private
 * @function deriveKey
 * @param {string} secret - The secret key to derive from
 * @returns {Buffer} 32-byte encryption key
 * @throws {Error} If secret is not provided
 *
 * @example
 * ```js
 * // Hex key (64 characters)
 * const hexKey = 'a'.repeat(64);
 * const key1 = deriveKey(hexKey); // Uses hex directly
 *
 * // String key
 * const stringKey = 'my-secret-password';
 * const key2 = deriveKey(stringKey); // SHA-256 derived
 * ```
 */
function deriveKey(secret) {
  if (!secret) {
    throw new Error('ENCRYPTION_SECRET environment variable is required');
  }

  // If a proper hex string is provided, use it directly
  if (/^[a-fA-F0-9]{64}$/.test(secret)) {
    return Buffer.from(secret, 'hex');
  }

  // Otherwise derive a 32-byte key via SHA-256
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * The derived encryption key used for all encryption/decryption operations.
 * Generated once at module load time for performance.
 * @constant {Buffer}
 */
const ENCRYPTION_KEY = deriveKey(process.env.ENCRYPTION_SECRET);

/**
 * Encrypts a text string using AES-256-CBC encryption.
 *
 * Generates a random initialization vector (IV) for each encryption to ensure
 * that identical plaintexts produce different ciphertexts. The IV is prepended
 * to the encrypted data with a colon separator for easy decryption.
 *
 * @function encrypt
 * @param {string} text - The plaintext to encrypt
 * @returns {string|null} Encrypted text in format 'iv:encryptedData' or null if input is falsy
 * @throws {Error} If encryption fails
 *
 * @example
 * ```js
 * // Basic encryption
 * const plaintext = 'my-secret-data';
 * const encrypted = encrypt(plaintext);
 * console.log(encrypted); // 'random-iv-hex:data-encrypted-hex'
 *
 * // Encrypt API key
 * const apiKey = 'sk-1234567890abcdef';
 * const encryptedKey = encrypt(apiKey);
 * // Safe to store in database or environment
 * ```
 */
export function encrypt(text) {
  if (!text) return null;

  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption failed:', error.message);
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

/**
 * Decrypts a text string that was encrypted with the encrypt function.
 *
 * Extracts the IV from the beginning of the encrypted string and uses it
 * along with the encryption key to decrypt the data. Returns null if decryption
 * fails, which can happen with wrong keys, corrupted data, or invalid format.
 *
 * @function decrypt
 * @param {string} text - The encrypted text in format 'iv:encryptedData'
 * @returns {string|null} Decrypted plaintext or null if decryption fails
 *
 * @example
 * ```js
 * // Basic decryption
 * const encrypted = 'random-iv-hex:data-encrypted-hex';
 * const decrypted = decrypt(encrypted);
 * console.log(decrypted); // 'my-original-data'
 *
 * // Decrypt stored API key
 * const storedKey = process.env.STORED_ENCRYPTED_KEY;
 * const apiKey = decrypt(storedKey);
 * if (apiKey) {
 *   // Use the decrypted key
 *   console.log('API Key available');
 * } else {
 *   console.error('Failed to decrypt API key');
 * }
 * ```
 */
export function decrypt(text) {
  if (!text) return null;

  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error.message);
    return null;
  }
}
