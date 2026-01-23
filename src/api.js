import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
});

// Assets API
export async function getAssets() {
  const response = await api.get('/assets');
  return response.data;
}

export async function getAsset(id) {
  const response = await api.get(`/assets/${id}`);
  return response.data;
}

export async function createAsset(asset) {
  const response = await api.post('/assets', asset);
  return response.data;
}

export async function updateAsset(id, asset) {
  const response = await api.put(`/assets/${id}`, asset);
  return response.data;
}

export async function deleteAsset(id) {
  const response = await api.delete(`/assets/${id}`);
  return response.data;
}

// Prices API
export async function getPrices() {
  const response = await api.get('/prices');
  return response.data;
}

export async function refreshPrices() {
  const response = await api.post('/prices/refresh');
  return response.data;
}

// Dashboard API
export async function getDashboard() {
  const response = await api.get('/dashboard');
  return response.data;
}

// Price History API
export async function getPriceHistory(symbol, days = 30) {
  const params = { days };
  if (symbol) params.symbol = symbol;
  const response = await api.get('/price-history', { params });
  return response.data;
}

// 补全历史价格数据
export async function backfillPriceHistory(days = 30) {
  const response = await api.post('/price-history/backfill', { days });
  return response.data;
}

// 获取汇率信息
export async function getRates() {
  const response = await api.get('/rates');
  return response.data;
}

// Auth API
export async function verifyPassword(password) {
  const response = await api.post('/auth/verify', { password });
  return response.data;
}

export async function hasPassword() {
  const response = await api.get('/auth/has-password');
  return response.data;
}

export async function changePassword(oldPassword, newPassword) {
  const response = await api.post('/auth/change-password', { oldPassword, newPassword });
  return response.data;
}

export default api;
