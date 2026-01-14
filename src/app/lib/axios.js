import axios from 'axios';
import toast from 'react-hot-toast';

// Get baseURL from environment
// For Next.js API routes, we'll handle them specially in the interceptor
const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const instance = axios.create({
  baseURL: baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Inject token into every request and fix double /api issue
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Fix double /api/api/ issue for Next.js API routes
    // If the URL path starts with /api/ and baseURL ends with /api, 
    // we need to use the Next.js server origin instead
    if (config.url && config.url.startsWith('/api/')) {
      // Check if baseURL ends with /api (which would cause /api/api/)
      if (config.baseURL && config.baseURL.endsWith('/api')) {
        // For Next.js API routes, use the origin without /api
        // In browser, we can use window.location.origin, but in SSR we need to handle differently
        if (typeof window !== 'undefined') {
          // Use the Next.js server origin (usually same as frontend in production, but different port in dev)
          // Since frontend is on 3002 and Next.js API is on 3000, we need to detect this
          const nextJsOrigin = window.location.origin.replace(':3002', ':3000');
          config.baseURL = nextJsOrigin;
        } else {
          // Server-side: remove /api from baseURL
          config.baseURL = config.baseURL.replace(/\/api$/, '');
        }
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ✅ Global error handler
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Something went wrong. Please try again.';
    toast.error(message);
    return Promise.reject(error);
  }
);

export default instance;
