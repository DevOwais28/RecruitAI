import axios from 'axios';
import useAuthStore from '../store/authStore';

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    (typeof window !== 'undefined'
      ? `${window.location.origin}/api`
      : 'http://localhost:4000/api'),
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;