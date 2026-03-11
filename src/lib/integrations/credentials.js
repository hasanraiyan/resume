import crypto from 'crypto';
import { decrypt, encrypt } from '@/lib/crypto';

export const REDACTED_CREDENTIAL_VALUE = '***************';

export const SENSITIVE_INTEGRATION_CREDENTIAL_FIELDS = [
  'botToken',
  'telegramAuthToken',
  'accessToken',
  'phoneNumberId',
  'verifyToken',
  'accountSid',
  'authToken',
];

const ENCRYPTED_CREDENTIAL_PATTERN = /^[0-9a-f]+:[0-9a-f]+$/i;

export function integrationMapToObject(value) {
  return value instanceof Map ? Object.fromEntries(value) : value || {};
}

export function integrationMetadataToObject(value) {
  return value instanceof Map ? Object.fromEntries(value) : value || {};
}

export function isEncryptedIntegrationCredential(value) {
  return typeof value === 'string' && ENCRYPTED_CREDENTIAL_PATTERN.test(value);
}

export function encryptSensitiveIntegrationCredentials(credentials = {}) {
  const encryptedCredentials = {};

  for (const [key, value] of Object.entries(integrationMapToObject(credentials))) {
    if (!value) {
      continue;
    }

    encryptedCredentials[key] = SENSITIVE_INTEGRATION_CREDENTIAL_FIELDS.includes(key)
      ? encrypt(value)
      : value;
  }

  return encryptedCredentials;
}

export function decryptSensitiveIntegrationCredentials(credentials = {}) {
  const decryptedCredentials = {};

  for (const [key, value] of Object.entries(integrationMapToObject(credentials))) {
    if (
      SENSITIVE_INTEGRATION_CREDENTIAL_FIELDS.includes(key) &&
      isEncryptedIntegrationCredential(value)
    ) {
      decryptedCredentials[key] = decrypt(value) ?? value;
    } else {
      decryptedCredentials[key] = value;
    }
  }

  return decryptedCredentials;
}

export function redactSensitiveIntegrationCredentials(credentials = {}) {
  const sanitizedCredentials = { ...integrationMapToObject(credentials) };

  for (const key of Object.keys(sanitizedCredentials)) {
    if (SENSITIVE_INTEGRATION_CREDENTIAL_FIELDS.includes(key)) {
      sanitizedCredentials[key] = REDACTED_CREDENTIAL_VALUE;
    }
  }

  return sanitizedCredentials;
}

export function sanitizeIntegrationForAdmin(integration) {
  const sanitized =
    typeof integration?.toObject === 'function' ? integration.toObject() : { ...integration };
  const decryptedCredentials = decryptSensitiveIntegrationCredentials(sanitized.credentials);

  if (sanitized.platform === 'telegram') {
    sanitized.telegramAuthCode = decryptedCredentials.telegramAuthToken || '';
  }

  if (sanitized.credentials) {
    sanitized.credentials = redactSensitiveIntegrationCredentials(sanitized.credentials);
  }

  return sanitized;
}

export function generateTelegramAuthCode() {
  return `tg_${crypto.randomBytes(6).toString('base64url')}`;
}

export function normalizeTelegramAuthorizedChats(authorizedChats = []) {
  if (!Array.isArray(authorizedChats)) {
    return [];
  }

  return authorizedChats
    .filter((entry) => entry?.chatId)
    .map((entry) => ({
      chatId: String(entry.chatId),
      ...(entry.username ? { username: entry.username } : {}),
      firstAuthorizedAt:
        entry.firstAuthorizedAt || entry.lastAuthorizedAt || new Date().toISOString(),
      lastAuthorizedAt:
        entry.lastAuthorizedAt || entry.firstAuthorizedAt || new Date().toISOString(),
    }));
}
