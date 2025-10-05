import axios from 'axios';

const service = axios.create({
    baseURL: '/api/v1',
    timeout: 5000,
});

service.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

service.interceptors.response.use(
    (response) => {
        const res = response.data;
        const successCodes = [200, 201];
        if (!successCodes.includes(res.code)) {
            return Promise.reject(new Error(res.message || 'Error'));
        }
        return res;
    },
    (error) => {
        if (error.response && error.response.data && error.response.data.message) {
            return Promise.reject(new Error(error.response.data.message));
        } else {
            console.error('Network Error:', error);
            return Promise.reject(new Error(error.message || '网络错误，请稍后重试'));
        }
    }
);

export default service;