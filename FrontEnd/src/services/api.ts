import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create a separate instance for public endpoints
const publicApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available (only for authenticated api)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add token to public API requests if available (optional authentication)
publicApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration (only for authenticated api)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect to login for protected routes that require authentication
    if (error.response?.status === 401 && error.config?.requireAuth !== false) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Public API doesn't redirect on 401 errors
publicApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect to login for public API calls
    return Promise.reject(error);
  }
);

export default api;
export { publicApi };
