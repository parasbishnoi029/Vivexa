import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer dev-sandbox-token-789'
  },
});

api.interceptors.response.use(
  (response) => {
    if (response.data && response.data.success !== undefined) {
      if (!response.data.success) {
        return Promise.reject(new Error(response.data.error || 'API Error'));
      }
      return response.data;
    }
    return response.data;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
