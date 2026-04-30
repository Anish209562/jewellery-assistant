import api from './api';

const buildOrderRequest = (data) => {
  const files = Array.from(data?.images || []);
  if (!files.length) return { payload: data, config: undefined };

  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (key === 'images' || value === undefined || value === null) return;
    formData.append(key, value);
  });
  files.forEach(file => formData.append('images', file));

  return {
    payload: formData,
    config: { headers: { 'Content-Type': 'multipart/form-data' } },
  };
};

// ─── Auth ────────────────────────────────────────────────────────
export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  getWorkers: () => api.get('/auth/workers'),
  createWorker: (data) => api.post('/auth/workers', data),
  deleteWorker: (id) => api.delete(`/auth/workers/${id}`),
};

// ─── Orders ──────────────────────────────────────────────────────
export const orderService = {
  getAll: (params) => api.get('/orders', { params }),
  getMyOrders: (params) => api.get('/orders/my-orders', { params }),
  getOne: (id) => api.get(`/orders/${id}`),
  getStats: () => api.get('/orders/stats'),
  create: (data) => {
    const { payload, config } = buildOrderRequest(data);
    return api.post('/orders', payload, config);
  },
  update: (id, data) => {
    const { payload, config } = buildOrderRequest(data);
    return api.put(`/orders/${id}`, payload, config);
  },
  delete: (id) => api.delete(`/orders/${id}`),
};

// ─── Inventory ───────────────────────────────────────────────────
export const inventoryService = {
  getAll: (params) => api.get('/inventory', { params }),
  getOne: (id) => api.get(`/inventory/${id}`),
  getStats: () => api.get('/inventory/stats'),
  create: (data) => api.post('/inventory', data),
  update: (id, data) => api.put(`/inventory/${id}`, data),
  delete: (id) => api.delete(`/inventory/${id}`),
};

// ─── Workers ─────────────────────────────────────────────────────
export const workerService = {
  getAll: (params) => api.get('/workers', { params }),
  getOne: (id) => api.get(`/workers/${id}`),
  getStats: () => api.get('/workers/stats'),
  create: (data) => api.post('/workers', data),
  update: (id, data) => api.put(`/workers/${id}`, data),
  delete: (id) => api.delete(`/workers/${id}`),
};

// ─── AI ──────────────────────────────────────────────────────────
export const aiService = {
  generateDesign: (data) => api.post('/ai/design', data),
  chat: (data) => api.post('/ai/chat', data),
};
