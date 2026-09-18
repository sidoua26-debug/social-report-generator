export const getBackendUrl = (path = '') => {
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');
  if (!path) return base;
  return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
};

export const API_BASE = `${getBackendUrl()}/api`;

export const api = {
  getToken() {
    return localStorage.getItem('token');
  },
  setToken(token) {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  },
  getUser() {
    const userStr = localStorage.getItem('user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },
  setUser(user) {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  },

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = { ...options.headers };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || 'Network request failed');
    }

    return data;
  },

  // Auth
  register(payload) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  login(payload) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  getMe() {
    return this.request('/auth/me');
  },

  // Agency
  updateBranding(payload) {
    return this.request('/agency/branding', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },
  uploadLogo(formData) {
    return this.request('/agency/logo', {
      method: 'POST',
      body: formData
    });
  },

  // Reports
  generateReport(formData) {
    return this.request('/reports/generate', {
      method: 'POST',
      body: formData
    });
  },
  getReports() {
    return this.request('/reports');
  },
  getReport(id) {
    return this.request(`/reports/${id}`);
  },
  deleteReport(id) {
    return this.request(`/reports/${id}`, {
      method: 'DELETE'
    });
  },
  getPublicReport(token) {
    return this.request(`/reports/public/${token}`);
  }
};
