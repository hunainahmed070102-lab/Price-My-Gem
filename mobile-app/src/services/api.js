import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/config';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

// Auth Services
export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.success) {
      await AsyncStorage.setItem('token', response.data.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.data));
      // Also save full_name locally for easy access
      if (response.data.data.full_name) {
        await AsyncStorage.setItem('fullName', response.data.data.full_name);
      }
    }
    return response.data;
  },

  sendRegisterOtp: async (email, full_name) => {
    const response = await api.post('/auth/send-register-otp', { email, full_name });
    return response.data;
  },

  register: async (full_name, email, password, otp) => {
    const response = await api.post('/auth/register', { full_name, email, password, otp });
    if (response.data.success) {
      await AsyncStorage.setItem('token', response.data.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.data));
      if (response.data.data.full_name) {
        await AsyncStorage.setItem('fullName', response.data.data.full_name);
      }
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

  logout: async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  },

  deleteAccount: async () => {
    const response = await api.delete('/auth/account');
    if (response.data?.success) {
      await AsyncStorage.multiRemove(['token', 'user', 'fullName', 'profileImage']);
    }
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  getCurrentUser: async () => {
    const userStr = await AsyncStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  },

  updateProfile: async (full_name) => {
    try {
      console.log('API: Updating profile with full_name:', full_name);
      const response = await api.put('/auth/profile', { full_name });
      console.log('API: Update profile response:', response.data);
      
      if (response.data.success) {
        // Update local storage
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          userData.full_name = full_name;
          await AsyncStorage.setItem('user', JSON.stringify(userData));
        }
        await AsyncStorage.setItem('fullName', full_name);
      }
      return response.data;
    } catch (error) {
      console.error('API: Update profile error:', error);
      console.error('API: Error response:', error.response?.data);
      console.error('API: Error status:', error.response?.status);
      throw error;
    }
  }
};

// Analysis Services
export const analysisService = {
  analyzeImage: async (imageUri) => {
    const formData = new FormData();
    const uriClean = (imageUri || '').split('?')[0];
    const extMatch = uriClean.match(/\.([a-zA-Z0-9]+)$/);
    const rawExt = extMatch ? extMatch[1].toLowerCase() : 'jpg';
    const mimeMap = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      gif: 'image/gif',
    };
    const fileExt = mimeMap[rawExt] ? rawExt : 'jpg';
    const mimeType = mimeMap[rawExt] || 'image/jpeg';

    formData.append('image', {
      uri: imageUri,
      type: mimeType,
      name: `gemstone.${fileExt}`
    });

    const response = await api.post('/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  getHistory: async () => {
    const response = await api.get('/history');
    return response.data;
  },

  getReport: async (reportId) => {
    const response = await api.get(`/report/${reportId}`);
    return response.data;
  },

  clearHistory: async () => {
    const response = await api.delete('/history');
    return response.data;
  },

  deleteReport: async (id) => {
    const response = await api.delete(`/report/${id}`);
    return response.data;
  }
};

// Market Price Services
export const priceService = {
  getAll: async () => {
    const response = await api.get('/prices');
    return response.data;
  },

  deletePrice: async (id) => {
    const response = await api.delete(`/admin/prices/${id}`);
    return response.data;
  }
};

export default api;
