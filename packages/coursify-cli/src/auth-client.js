import { request } from 'undici';
import Conf from 'conf';

const config = new Conf({ projectName: 'coursify-cli' });

export async function login() {
  const baseUrl = config.get('baseUrl', 'https://hasanraiyan.me');

  const { body } = await request(`${baseUrl}/api/auth/device/code`, {
    method: 'POST',
  });

  const data = await body.json();
  return data;
}

export async function pollToken(deviceCode, interval) {
  const baseUrl = config.get('baseUrl', 'https://hasanraiyan.me');

  const poll = async () => {
    const { body, statusCode } = await request(`${baseUrl}/api/auth/device/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_code: deviceCode }),
    });

    const data = await body.json();

    if (statusCode === 200) {
      return data;
    }

    if (data.error === 'authorization_pending') {
      await new Promise(resolve => setTimeout(resolve, interval * 1000));
      return poll();
    }

    throw new Error(data.error);
  };

  return poll();
}

export function saveToken(token) {
  config.set('token', token);
}

export function getToken() {
  return config.get('token');
}

export function clearToken() {
  config.delete('token');
}
