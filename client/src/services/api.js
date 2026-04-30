import axios from 'axios';

/**
 * Axios instance pre-configured with base URL and JWT interceptor
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050/api',
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach JWT token if present ──────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwl_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: auto-logout on 401 ─────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('jwl_token');
      localStorage.removeItem('jwl_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
