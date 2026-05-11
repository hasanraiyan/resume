import { loadCredentials, saveCredentials, isTokenExpired } from './token-store.js';
import { refreshToken } from './oauth.js';

export class CoursifyApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async _ensureValidToken() {
    let credentials = loadCredentials();
    if (!credentials) {
      throw new Error('Not authenticated. Run `coursify auth login`');
    }

    if (isTokenExpired(credentials)) {
      if (!credentials.refresh_token) {
        throw new Error(
          'Session expired and no refresh token available. Run `coursify auth login`'
        );
      }

      const tokens = await refreshToken({
        baseUrl: this.baseUrl,
        refreshToken: credentials.refresh_token,
        clientId: credentials.client_id,
      });

      credentials = {
        ...credentials,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || credentials.refresh_token,
        expiresAt: Date.now() + tokens.expires_in * 1000,
      };
      saveCredentials(credentials);
    }

    return credentials.access_token;
  }

  async _request(path, options = {}) {
    const token = await this._ensureValidToken();
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || error.message || `Request failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Course operations
  async listCourses() {
    const data = await this._request('/api/coursify/bootstrap');
    return data.courses;
  }

  async createCourse(payload) {
    const data = await this._request('/api/coursify/courses', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data.course;
  }

  async updateCourse(id, patch) {
    const data = await this._request(`/api/coursify/courses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    return data.course;
  }

  async publishCourse(id) {
    return this._request(`/api/coursify/courses/${id}/publish`, {
      method: 'POST',
    });
  }

  // Module operations
  async createModule(courseId, payload) {
    const data = await this._request(`/api/coursify/courses/${courseId}/modules`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data.module;
  }

  async updateModule(id, patch) {
    const data = await this._request(`/api/coursify/modules/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    return data.module;
  }

  // Section operations
  async createSection(courseId, payload) {
    const data = await this._request(`/api/coursify/courses/${courseId}/sections`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data.section;
  }

  async updateSection(id, patch) {
    const data = await this._request(`/api/coursify/sections/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    return data.section;
  }
}
