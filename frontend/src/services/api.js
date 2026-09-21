import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for session expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't loop if already on login/register
      const isAuthEndpoint = error.config.url.includes('/auth/login') || error.config.url.includes('/auth/register');
      if (!isAuthEndpoint) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
          window.location.href = '/login?expired=true';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
};

export const incomeAPI = {
  getAll: (params) => api.get('/income', { params }),
  create: (data) => api.post('/income', data),
  update: (id, data) => api.put(`/income/${id}`, data),
  delete: (id) => api.delete(`/income/${id}`),
  getSources: () => api.get('/income/sources'),
};

export const expenseAPI = {
  getAll: (params) => api.get('/expenses', { params }),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
  getCategories: () => api.get('/expenses/categories'),
};

export const budgetAPI = {
  getAll: (params) => api.get('/budgets', { params }),
  save: (data) => api.post('/budgets', data),
  update: (id, data) => api.put(`/budgets/${id}`, data),
  delete: (id) => api.delete(`/budgets/${id}`),
  saveBatch: (data) => api.post('/budgets/batch', data),
};

export const goalAPI = {
  getAll: () => api.get('/goals'),
  create: (data) => api.post('/goals', data),
  update: (id, data) => api.put(`/goals/${id}`, data),
  updateProgress: (id, data) => api.patch(`/goals/${id}/progress`, data),
  delete: (id) => api.delete(`/goals/${id}`),
};

export const dashboardAPI = {
  getSummary: (params) => api.get('/dashboard/summary', { params }),
  getCategoryBreakdown: (params) => api.get('/dashboard/category-breakdown', { params }),
  getMonthlyTrend: (params) => api.get('/dashboard/monthly-trend', { params }),
  getRecent: (params) => api.get('/dashboard/recent', { params }),
};

export const aiAPI = {
  analyze: (data) => api.post('/ai/analyze', data),
  generateBudget: (data) => api.post('/ai/generate-budget', data),
  chat: (data) => api.post('/ai/chat', data),
  getChatHistory: (params) => api.get('/ai/chat/history', { params }),
  clearChatHistory: () => api.delete('/ai/chat/history'),
};

export const reportAPI = {
  getMonthly: (params) => api.get('/reports/monthly', { params }),
};

export default api;
