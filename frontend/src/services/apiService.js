// API service for communicating with the backend

const API_BASE_URL = 'http://localhost:4010/api';

// Generic API call helper
const apiCall = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });

        if (response.status === 401) {
            localStorage.removeItem('token');
            // Check if we are not already on login/signup page avoiding loops
            if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
                window.location.href = '/login';
            }
            throw new Error('Session expired');
        }

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'API Error');
        }

        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

// Auth API
export const authAPI = {
    register: (userData) => apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
    }),

    login: (userData) => apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify(userData)
    }),

    getMe: () => apiCall('/auth/me')
};

// Projects API
export const projectsAPI = {
    getAll: () => apiCall('/projects'),

    getById: (id) => apiCall(`/projects/${id}`),

    create: (project) => apiCall('/projects', {
        method: 'POST',
        body: JSON.stringify(project)
    }),

    update: (id, project) => apiCall(`/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(project)
    }),

    delete: (id) => apiCall(`/projects/${id}`, {
        method: 'DELETE'
    })
};

// Transactions API
export const transactionsAPI = {
    getAll: () => apiCall('/transactions'),

    getByProject: (projectId) => apiCall(`/transactions/project/${projectId}`),

    getById: (id) => apiCall(`/transactions/${id}`),

    getStats: (projectId) => apiCall(`/transactions/stats/${projectId}`),

    create: (transaction) => apiCall('/transactions', {
        method: 'POST',
        body: JSON.stringify(transaction)
    }),

    update: (id, transaction) => apiCall(`/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(transaction)
    }),

    delete: (id) => apiCall(`/transactions/${id}`, {
        method: 'DELETE'
    })
};

// Labels API
export const labelsAPI = {
    getAll: () => apiCall('/labels'),

    getById: (id) => apiCall(`/labels/${id}`),

    create: (label) => apiCall('/labels', {
        method: 'POST',
        body: JSON.stringify(label)
    }),

    initDefaults: () => apiCall('/labels/init', {
        method: 'POST'
    }),

    update: (id, label) => apiCall(`/labels/${id}`, {
        method: 'PUT',
        body: JSON.stringify(label)
    }),

    delete: (id) => apiCall(`/labels/${id}`, {
        method: 'DELETE'
    })
};

// Settings API
export const settingsAPI = {
    getAll: () => apiCall('/settings'),

    getByKey: (key) => apiCall(`/settings/${key}`),

    update: (key, value) => apiCall(`/settings/${key}`, {
        method: 'PUT',
        body: JSON.stringify({ value })
    }),

    initDefaults: () => apiCall('/settings/init', {
        method: 'POST'
    })
};

// Subscriptions API
export const subscriptionsAPI = {
    getByProject: (projectId) => apiCall(`/subscriptions/project/${projectId}`),

    create: (subscription) => apiCall('/subscriptions', {
        method: 'POST',
        body: JSON.stringify(subscription)
    }),

    update: (id, subscription) => apiCall(`/subscriptions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(subscription)
    }),

    delete: (id) => apiCall(`/subscriptions/${id}`, {
        method: 'DELETE'
    })
};
