import { request } from 'undici';
import Conf from 'conf';

const config = new Conf({ projectName: 'coursify-cli' });

export async function apiClient(endpoint, options = {}) {
  const baseUrl = config.get('baseUrl', 'https://hasanraiyan.me');
  const token = config.get('token');

  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const { body, statusCode } = await request(url, {
    ...options,
    headers,
  });

  const data = await body.json();

  if (statusCode >= 400) {
    throw new Error(data.error || data.message || `Request failed with status ${statusCode}`);
  }

  return data;
}
