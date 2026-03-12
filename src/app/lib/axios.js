import axios from 'axios';
import toast from 'react-hot-toast';

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
        const token = localStorage.getItem('token');
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
        const message =
            error?.response?.data?.message ||
            error?.message ||
            'Something went wrong. Please try again.';
        toast.error(message);
        return Promise.reject(error);
    }
);

export default instance;