import axios from 'axios';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

// Add a request interceptor to include the JWT token and Organization ID
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    const orgId = localStorage.getItem('organizationId');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    if (orgId && orgId !== 'undefined' && orgId !== 'null') {
        config.headers['x-organization-id'] = orgId;
    }

    // Handle subdomain multi-tenancy
    const host = window.location.host;
    if (host.includes('.') && !host.startsWith('localhost') && !host.startsWith('www')) {
        const subdomain = host.split('.')[0];
        config.headers['x-subdomain'] = subdomain;
    }

    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;
