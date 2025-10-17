import axios from 'axios';
import { auth } from '../config/firebase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - could trigger logout
      console.error('Unauthorized access');
    }
    return Promise.reject(error);
  }
);

// Visitors API
export const visitorsAPI = {
  getAll: (status) => api.get('/api/visitors', { params: { status } }),
  create: (visitorData) => api.post('/api/visitors', visitorData),
  approve: (visitorId) => api.post(`/api/visitors/${visitorId}/approve`),
  deny: (visitorId, reason) => api.post(`/api/visitors/${visitorId}/deny`, { reason }),
  checkIn: (visitorId) => api.post(`/api/visitors/${visitorId}/checkin`),
  checkOut: (visitorId) => api.post(`/api/visitors/${visitorId}/checkout`)
};

// Chat API
export const chatAPI = {
  sendMessage: (messages) => api.post('/api/chat', { messages })
};

// Audit API
export const auditAPI = {
  getEvents: (filters) => api.get('/api/audit', { params: filters }),
  getStats: (startDate, endDate) => api.get('/api/audit/stats', { 
    params: { startDate, endDate } 
  })
};

// Health check
export const healthCheck = () => api.get('/health');

export default api;