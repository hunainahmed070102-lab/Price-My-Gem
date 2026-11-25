import axios from 'axios';
import { API_BASE_URL } from '../utils/config';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - add auth token (supports both token & adminToken)
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem('token') ||
      localStorage.getItem('adminToken');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors without blanking the screen
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isAuthRoute =
      url.includes('/auth/login') ||
      url.includes('/auth/forgot-password') ||
      url.includes('/auth/verify-otp') ||
      url.includes('/auth/reset-password');

    // Only redirect if genuinely an unauthenticated session on critical actions
    if (error.response?.status === 401 && !isAuthRoute) {
      console.warn('API returned 401 Unauthorized for:', url);
    }
    return Promise.reject(error);
  }
);

// Auth Services
export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.success) {
      const token = response.data.data.token;
      localStorage.setItem('token', token);
      localStorage.setItem('adminToken', token);
      localStorage.setItem('user', JSON.stringify(response.data.data));
      if (response.data.data.email) localStorage.setItem('adminEmail', response.data.data.email);
      if (response.data.data.full_name) localStorage.setItem('adminName', response.data.data.full_name);
      localStorage.setItem('adminRole', response.data.data.role === 'admin' ? 'Super Admin' : 'Officer');
    }
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  verifyOtp: async (email, otp) => {
    const response = await api.post('/auth/verify-otp', { email, otp });
    return response.data;
  },

  resetPassword: async (email, otp, newPassword) => {
    const response = await api.post('/auth/reset-password', { email, otp, newPassword });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('user');
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('adminName');
    localStorage.removeItem('adminRole');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: () => {
    return !!(localStorage.getItem('token') || localStorage.getItem('adminToken'));
  },

  isAdmin: () => {
    const user = authService.getCurrentUser();
    return (
      user?.role === 'admin' ||
      localStorage.getItem('adminRole') === 'Super Admin' ||
      Boolean(localStorage.getItem('adminToken'))
    );
  }
};

// Admin Services
export const adminService = {
  getUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  getReports: async () => {
    const response = await api.get('/admin/reports');
    return response.data;
  },

  getStatistics: async () => {
    const response = await api.get('/admin/statistics');
    return response.data;
  },

  getPrices: async () => {
    const response = await api.get('/admin/prices');
    return response.data;
  },

  createPrice: async (payload) => {
    const isFormData = payload instanceof FormData;
    const response = await api.post('/admin/prices', payload, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
    return response.data;
  },

  updatePrice: async (id, payload) => {
    const isFormData = payload instanceof FormData;
    const body = isFormData || typeof payload === 'object'
      ? payload
      : { price_per_carat: payload };
    const response = await api.put(`/admin/prices/${id}`, body, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
    return response.data;
  },

  deletePrice: async (id) => {
    const response = await api.delete(`/admin/prices/${id}`);
    return response.data;
  },

  updateReport: async (id, data) => {
    const response = await api.put(`/admin/reports/${id}`, data);
    return response.data;
  },

  deleteReport: async (id) => {
    const response = await api.delete(`/admin/reports/${id}`);
    return response.data;
  },

  getNotifications: async () => {
    const response = await api.get('/admin/notifications');
    return response.data;
  },

  markNotificationRead: async (id) => {
    const response = await api.put(`/admin/notifications/${encodeURIComponent(id)}/read`);
    return response.data;
  },

  markAllNotificationsRead: async () => {
    const response = await api.put('/admin/notifications/read-all');
    return response.data;
  },

  dismissNotification: async (id) => {
    const response = await api.delete(`/admin/notifications/${encodeURIComponent(id)}`);
    return response.data;
  },

  dismissAllNotifications: async () => {
    const response = await api.delete('/admin/notifications');
    return response.data;
  },

  updateUserStatus: async (id, status) => {
    const response = await api.put(`/admin/users/${id}/status`, { status });
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/admin/profile');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put('/admin/profile', data);
    return response.data;
  },

  updateProfilePicture: async (formData) => {
    const response = await api.post('/admin/profile/picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/admin/profile/password', {
      currentPassword,
      newPassword
    });
    return response.data;
  }
};

export default api;
