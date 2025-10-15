// src/lib/crypto.js
import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

// Ensure the key is the correct length for AES-256 (32 bytes)
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

const ENCRYPTION_KEY = deriveKey(process.env.ENCRYPTION_SECRET);

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
