import axios from 'axios';
import toast from 'react-hot-toast';
import { clearAuthSession, isPublicAuthRequestUrl } from '@/app/lib/authSession';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const instance = axios.create({
    baseURL: baseURL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

instance.interceptors.request.use(
    (config) => {
        const token =
            typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

instance.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;
        const requestUrl = error?.config?.url || '';
        const skipGlobalErrorToast = Boolean(error?.config?.skipGlobalErrorToast);
        const serverMessage = error?.response?.data?.message;

        // Expired or invalid token: clear session and send user to login (not on public auth calls).
        if (
            status === 401 &&
            typeof window !== 'undefined' &&
            !isPublicAuthRequestUrl(requestUrl)
        ) {
            clearAuthSession();
            toast.error('Your session has expired. Please sign in again.');
            window.location.replace('/');
            return Promise.reject(error);
        }

        let message = serverMessage;
        if (!message) {
            if (status === 400) message = 'Request failed. Please check your input and try again.';
            else if (status === 403) message = 'You do not have permission to perform this action.';
            else if (status === 404) message = 'Requested resource was not found.';
            else if (status >= 500) message = 'Server error. Please try again shortly.';
            else message = error?.message || 'Something went wrong. Please try again.';
        }
        if (!skipGlobalErrorToast) {
            toast.error(message);
        }
        return Promise.reject(error);
    }
);

export default instance;