import { mockApi } from './mockData';

const USE_MOCK_DATA = false;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const REQUEST_TIMEOUT_MS = 30000;

let onUnauthorized = null;

export const setOnUnauthorized = (callback) => {
  onUnauthorized = callback;
};

const httpRequest = async (method, endpoint, data = null, options = {}) => {
  const token = localStorage.getItem('authToken');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs || REQUEST_TIMEOUT_MS);

  const fetchOptions = {
    method,
    headers: { 'Content-Type': 'application/json' },
    signal: controller.signal,
  };

  if (token) {
    fetchOptions.headers['Authorization'] = `Bearer ${token}`;
  }

  let url = `${API_BASE_URL}${endpoint}`;

  if (data && method === 'GET') {
    const params = new URLSearchParams();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  } else if (data) {
    fetchOptions.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);

    if (response.status === 401) {
      localStorage.removeItem('authToken');
      if (onUnauthorized) onUnauthorized();
      const errorBody = await response.json().catch(() => null);
      throw errorBody || new Error('Session expired. Please log in again.');
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw errorBody || new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw error;
  }
};

export const api = {
  getDashboard: () => USE_MOCK_DATA
    ? mockApi.getDashboard()
    : httpRequest('GET', '/dashboard'),

  getSuppliers: (params) => USE_MOCK_DATA
    ? mockApi.getSuppliers(params)
    : httpRequest('GET', '/suppliers', params),

  getSupplierById: (id) => USE_MOCK_DATA
    ? mockApi.getSupplierById(id)
    : httpRequest('GET', `/suppliers/${id}`),

  addSupplier: (data) => USE_MOCK_DATA
    ? mockApi.addSupplier(data)
    : httpRequest('POST', '/suppliers', data),

  updateSupplier: (id, data) => USE_MOCK_DATA
    ? mockApi.updateSupplier(id, data)
    : httpRequest('PUT', `/suppliers/${id}`, data),

  deleteSupplier: (id) => USE_MOCK_DATA
    ? mockApi.deleteSupplier(id)
    : httpRequest('DELETE', `/suppliers/${id}`),

  getItems: (params) => USE_MOCK_DATA
    ? mockApi.getItems(params)
    : httpRequest('GET', '/items', params),

  getItemById: (id) => USE_MOCK_DATA
    ? mockApi.getItemById(id)
    : httpRequest('GET', `/items/${id}`),

  getItemsInventory: (params) => USE_MOCK_DATA
    ? mockApi.getItemsInventory(params)
    : httpRequest('GET', '/items/inventory', params),

  getAvailableItems: (params) => USE_MOCK_DATA
    ? mockApi.getAvailableItems(params)
    : httpRequest('GET', '/items/available', params),

  getLowStockItems: () => USE_MOCK_DATA
    ? mockApi.getItemsInventory({ low_stock: true })
    : httpRequest('GET', '/items/low-stock'),

  addItem: (data) => USE_MOCK_DATA
    ? mockApi.addItem(data)
    : httpRequest('POST', '/items', data),

  updateItem: (id, data) => USE_MOCK_DATA
    ? mockApi.updateItem(id, data)
    : httpRequest('PUT', `/items/${id}`, data),

  deleteItem: (id) => USE_MOCK_DATA
    ? mockApi.deleteItem(id)
    : httpRequest('DELETE', `/items/${id}`),

  adjustStock: (id, data) => USE_MOCK_DATA
    ? mockApi.adjustStock(id, data)
    : httpRequest('POST', `/items/${id}/adjust-stock`, data),

  getItemTransactions: (id, params) => USE_MOCK_DATA
    ? mockApi.getItemTransactions(id, params)
    : httpRequest('GET', `/items/${id}/transactions`),

  getCategories: () => USE_MOCK_DATA
    ? mockApi.getCategories()
    : httpRequest('GET', '/categories'),

  addCategory: (data) => USE_MOCK_DATA
    ? mockApi.addCategory(data)
    : httpRequest('POST', '/categories', data),

  updateCategory: (id, data) => USE_MOCK_DATA
    ? mockApi.updateCategory(id, data)
    : httpRequest('PUT', `/categories/${id}`, data),

  deleteCategory: (id) => USE_MOCK_DATA
    ? mockApi.deleteCategory(id)
    : httpRequest('DELETE', `/categories/${id}`),

  getPurchaseOrders: (params) => USE_MOCK_DATA
    ? mockApi.getPurchaseOrders(params)
    : httpRequest('GET', '/purchase-orders', params),

  getPurchaseOrderById: (id) => USE_MOCK_DATA
    ? mockApi.getPurchaseOrderById(id)
    : httpRequest('GET', `/purchase-orders/${id}`),

  createPurchaseOrder: (data) => USE_MOCK_DATA
    ? mockApi.createPurchaseOrder(data)
    : httpRequest('POST', '/purchase-orders', data),

  updatePurchaseOrder: (id, data) => USE_MOCK_DATA
    ? mockApi.updatePurchaseOrder(id, data)
    : httpRequest('PUT', `/purchase-orders/${id}`, data),

  updatePurchaseOrderStatus: (id, data) => USE_MOCK_DATA
    ? mockApi.updatePurchaseOrderStatus(id, data)
    : httpRequest('PATCH', `/purchase-orders/${id}/status`, data),

  deletePurchaseOrder: (id) => USE_MOCK_DATA
    ? mockApi.deletePurchaseOrder(id)
    : httpRequest('DELETE', `/purchase-orders/${id}`),

  getCustomers: (params) => USE_MOCK_DATA
    ? mockApi.getCustomers(params)
    : httpRequest('GET', '/customers', params),

  getCustomerById: (id) => USE_MOCK_DATA
    ? mockApi.getCustomerById(id)
    : httpRequest('GET', `/customers/${id}`),

  searchCustomer: (phone) => USE_MOCK_DATA
    ? mockApi.searchCustomer(phone)
    : httpRequest('GET', `/customers/search?phone=${phone}`),

  addCustomer: (data) => USE_MOCK_DATA
    ? mockApi.addCustomer(data)
    : httpRequest('POST', '/customers', data),

  updateCustomer: (id, data) => USE_MOCK_DATA
    ? mockApi.updateCustomer(id, data)
    : httpRequest('PUT', `/customers/${id}`, data),

  deleteCustomer: (id) => USE_MOCK_DATA
    ? mockApi.deleteCustomer(id)
    : httpRequest('DELETE', `/customers/${id}`),

  getSales: (params) => USE_MOCK_DATA
    ? mockApi.getSales(params)
    : httpRequest('GET', '/sales', params),

  getSaleById: (id) => USE_MOCK_DATA
    ? mockApi.getSaleById(id)
    : httpRequest('GET', `/sales/${id}`),

  getSaleDetails: (id) => USE_MOCK_DATA
    ? mockApi.getSaleDetails(id)
    : httpRequest('GET', `/sales/${id}/details`),

  createSale: (data) => USE_MOCK_DATA
    ? mockApi.createSale(data)
    : httpRequest('POST', '/sales', data),

  updateSale: (id, data) => USE_MOCK_DATA
    ? mockApi.updateSale(id, data)
    : httpRequest('PUT', `/sales/${id}`, data),

  deleteSale: (id) => USE_MOCK_DATA
    ? mockApi.deleteSale(id)
    : httpRequest('DELETE', `/sales/${id}`),

  getSupplierPayments: (supplierId, params) => USE_MOCK_DATA
    ? mockApi.getSupplierPayments(supplierId, params)
    : httpRequest('GET', `/suppliers/${supplierId}/payments`),

  recordSupplierPayment: (data) => USE_MOCK_DATA
    ? mockApi.recordSupplierPayment(data)
    : httpRequest('POST', '/payments/supplier', data),

  getPendingSupplierPayments: () => USE_MOCK_DATA
    ? mockApi.getPendingSupplierPayments()
    : httpRequest('GET', '/payments/supplier/pending'),

  getSupplierPurchaseOrders: (supplierId) => USE_MOCK_DATA
    ? Promise.resolve({ data: { purchase_orders: [] } })
    : httpRequest('GET', `/suppliers/${supplierId}/purchase-orders`),

  getSummaryReport: (params) => USE_MOCK_DATA
    ? mockApi.getSummaryReport(params)
    : httpRequest('GET', '/reports/summary'),

  getTopItems: (params) => USE_MOCK_DATA
    ? mockApi.getTopItems(params)
    : httpRequest('GET', '/reports/top-items'),

  login: (data) => httpRequest('POST', '/auth/login', data),

  register: (data) => httpRequest('POST', '/auth/register', data),

  googleAuth: (idToken) => httpRequest('POST', '/auth/google', { id_token: idToken }),
};

export default api;
