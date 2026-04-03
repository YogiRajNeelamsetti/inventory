// src/services/mlApi.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const REQUEST_TIMEOUT_MS = 30000;

const httpRequest = async (method, endpoint, data = null) => {
  const token = localStorage.getItem('authToken');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const fetchOptions = {
    method,
    headers: { 'Content-Type': 'application/json' },
    signal: controller.signal,
  };
  if (token) fetchOptions.headers['Authorization'] = `Bearer ${token}`;
  let url = `${API_BASE_URL}${endpoint}`;
  if (data && method === 'GET') {
    const params = new URLSearchParams();
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.append(k, v);
    });
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }
  try {
    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);
    if (response.status === 401) {
      localStorage.removeItem('authToken');
      throw new Error('Session expired. Please log in again.');
    }
    if (!response.ok) {
      const errBody = await response.json().catch(() => null);
      // Spring Boot error shape: { success:false, error: { code, message } }
      const msg = errBody?.error?.message ?? errBody?.message ?? `HTTP error! status: ${response.status}`;
      throw new Error(msg);
    }
    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') throw new Error('Request timed out. Please try again.');
    throw error;
  }
};

// ── CONFIRMED response shapes from Network tab ────────────────────────────────
//
// Forecast:  { success, data: { decision: { item_id, item_name, daily_sale, stock, days_left, action, message } } }
// Recs:      { success, data: { recommendations: [{ item_id, item_name, category, stock, action, message }] } }
// Trends:    { success, data: { trends: [{ category, trend, growth_rate, message }] } }

export const getForecast = async (itemId, days = 30) => {
  const res = await httpRequest('GET', `/forecast/item/${itemId}`, { days });
  const d = res?.data?.decision ?? {};
  return {
    item_id:    d.item_id    ?? 0,
    item_name:  d.item_name  ?? '',
    daily_sale: d.daily_sale ?? 0,
    stock:      d.stock      ?? 0,
    days_left:  d.days_left  ?? 0,
    action:     d.action     ?? 'OK',
    message:    d.message    ?? '',
  };
};

export const getRecommendations = async () => {
  const res = await httpRequest('GET', '/forecast/recommendations');
  const list = res?.data?.recommendations ?? [];
  return list.map(r => ({
    item_id:   r.item_id   ?? 0,
    item_name: r.item_name ?? 'Unknown',
    category:  r.category  ?? '—',
    stock:     r.stock     ?? 0,
    action:    r.action    ?? 'WATCH',
    message:   r.message   ?? '',
  }));
};

export const getCategoryTrends = async () => {
  const res = await httpRequest('GET', '/forecast/trends');
  const list = res?.data?.trends ?? [];
  return list.map(t => ({
    category:    t.category    ?? 'Unknown',
    trend:       t.trend       ?? 'STABLE',
    growth_rate: t.growth_rate ?? 0,
    message:     t.message     ?? '',
  }));
};
