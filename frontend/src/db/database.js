// Database initialization and operations using IndexedDB

const DB_NAME = 'FinanceManagerDB';
const DB_VERSION = 1;

let db = null;

// Initialize database
export const initDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // Projects store
            if (!db.objectStoreNames.contains('projects')) {
                const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
                projectStore.createIndex('createdAt', 'createdAt', { unique: false });
            }

            // Transactions store
            if (!db.objectStoreNames.contains('transactions')) {
                const transactionStore = db.createObjectStore('transactions', { keyPath: 'id' });
                transactionStore.createIndex('projectId', 'projectId', { unique: false });
                transactionStore.createIndex('date', 'date', { unique: false });
                transactionStore.createIndex('labelId', 'labelId', { unique: false });
                transactionStore.createIndex('type', 'type', { unique: false });
            }

            // Labels store
            if (!db.objectStoreNames.contains('labels')) {
                const labelStore = db.createObjectStore('labels', { keyPath: 'id' });
                // Add default labels
                labelStore.transaction.oncomplete = () => {
                    const labels = db.transaction('labels', 'readwrite').objectStore('labels');
                    const defaultLabels = [
                        { id: 'food', name: 'אוכל', color: '#f59e0b' },
                        { id: 'transport', name: 'תחבורה', color: '#3b82f6' },
                        { id: 'shopping', name: 'קניות', color: '#8b5cf6' },
                        { id: 'salary', name: 'משכורת', color: '#10b981' },
                        { id: 'other', name: 'אחר', color: '#6b7280' }
                    ];
                    defaultLabels.forEach(label => labels.add(label));
                };
            }

            // Settings store
            if (!db.objectStoreNames.contains('settings')) {
                const settingsStore = db.createObjectStore('settings', { keyPath: 'key' });
                settingsStore.transaction.oncomplete = () => {
                    const settings = db.transaction('settings', 'readwrite').objectStore('settings');
                    settings.add({ key: 'displayCurrency', value: 'ILS' });
                };
            }
        };
    });
};

// Generic CRUD operations
const getStore = (storeName, mode = 'readonly') => {
    return db.transaction(storeName, mode).objectStore(storeName);
};

// Projects
export const createProject = (project) => {
    return new Promise((resolve, reject) => {
        const store = getStore('projects', 'readwrite');
        const request = store.add({
            ...project,
            id: crypto.randomUUID(),
            createdAt: Date.now()
        });
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const getAllProjects = () => {
    return new Promise((resolve, reject) => {
        const store = getStore('projects');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const getProject = (id) => {
    return new Promise((resolve, reject) => {
        const store = getStore('projects');
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const updateProject = (project) => {
    return new Promise((resolve, reject) => {
        const store = getStore('projects', 'readwrite');
        const request = store.put(project);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const deleteProject = (id) => {
    return new Promise((resolve, reject) => {
        const store = getStore('projects', 'readwrite');
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

// Transactions
export const createTransaction = (transaction) => {
    return new Promise((resolve, reject) => {
        const store = getStore('transactions', 'readwrite');
        const request = store.add({
            ...transaction,
            id: crypto.randomUUID()
        });
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const getTransactionsByProject = (projectId) => {
    return new Promise((resolve, reject) => {
        const store = getStore('transactions');
        const index = store.index('projectId');
        const request = index.getAll(projectId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const getAllTransactions = () => {
    return new Promise((resolve, reject) => {
        const store = getStore('transactions');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const updateTransaction = (transaction) => {
    return new Promise((resolve, reject) => {
        const store = getStore('transactions', 'readwrite');
        const request = store.put(transaction);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const deleteTransaction = (id) => {
    return new Promise((resolve, reject) => {
        const store = getStore('transactions', 'readwrite');
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

// Labels
export const createLabel = (label) => {
    return new Promise((resolve, reject) => {
        const store = getStore('labels', 'readwrite');
        const request = store.add({
            ...label,
            id: crypto.randomUUID()
        });
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const getAllLabels = () => {
    return new Promise((resolve, reject) => {
        const store = getStore('labels');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const updateLabel = (label) => {
    return new Promise((resolve, reject) => {
        const store = getStore('labels', 'readwrite');
        const request = store.put(label);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const deleteLabel = (id) => {
    return new Promise((resolve, reject) => {
        const store = getStore('labels', 'readwrite');
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

// Settings
export const getSetting = (key) => {
    return new Promise((resolve, reject) => {
        const store = getStore('settings');
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result?.value);
        request.onerror = () => reject(request.error);
    });
};

export const setSetting = (key, value) => {
    return new Promise((resolve, reject) => {
        const store = getStore('settings', 'readwrite');
        const request = store.put({ key, value });
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};
