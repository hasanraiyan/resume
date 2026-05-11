import fs from 'fs';
import path from 'path';
import os from 'os';

const CREDENTIALS_DIR = path.join(os.homedir(), '.coursify');
const CREDENTIALS_FILE = path.join(CREDENTIALS_DIR, 'credentials.json');

export function loadCredentials() {
  try {
    if (!fs.existsSync(CREDENTIALS_FILE)) return null;
    const data = fs.readFileSync(CREDENTIALS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return null;
  }
}

export function saveCredentials(data) {
  if (!fs.existsSync(CREDENTIALS_DIR)) {
    fs.mkdirSync(CREDENTIALS_DIR, { recursive: true, mode: 0o700 });
  }
  fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(data, null, 2), { mode: 0o600 });
}

export function clearCredentials() {
  if (fs.existsSync(CREDENTIALS_FILE)) {
    fs.unlinkSync(CREDENTIALS_FILE);
  }
}

export function isTokenExpired(credentials) {
  if (!credentials || !credentials.expiresAt) return true;
  // Buffer of 30 seconds
  return credentials.expiresAt < Date.now() + 30000;
}
