import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pb_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('pb_token');
      localStorage.removeItem('pb_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

// Clients
export const clientsAPI = {
  list: (params) => api.get('/clients', { params }),
  get: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
};

// Projects
export const projectsAPI = {
  list: (params) => api.get('/projects', { params }),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
};

// Analytics
export const analyticsAPI = {
  overview: () => api.get('/analytics/overview'),
  resolveAlert: (id) => api.patch(`/analytics/alerts/${id}/resolve`),
};

// Billing / Stripe
export const billingAPI = {
  plans: () => api.get('/billing/plans'),
  status: () => api.get('/billing/status'),
  checkout: (plan) => api.post('/billing/checkout', { plan }),
  portal: () => api.post('/billing/portal'),
  cancel: () => api.post('/billing/cancel'),
  resume: () => api.post('/billing/resume'),
};

// CSV Export (returns a download URL — open directly in browser)
export const exportAPI = {
  clientsCSV: () => `/api/export/clients.csv`,
  projectsCSV: () => `/api/export/projects.csv`,
  activitiesCSV: () => `/api/export/activities.csv`,
  // Download helper — opens URL with auth token as query param
  download: (path) => {
    const token = localStorage.getItem('pb_token');
    const url = `${path}?token=${token}`;
    const a = document.createElement('a');
    a.href = url; a.download = ''; a.click();
  },
};

// Check-ins
export const checkinsAPI = {
  list: (params) => api.get('/checkins', { params }),
  create: (data) => api.post('/checkins', data),
  delete: (id) => api.delete(`/checkins/${id}`),
};

export default api;
