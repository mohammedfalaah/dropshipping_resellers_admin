import axios from "axios";

// Default to production Vercel backend API, or local override via VITE_API_BASE_URL
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://dropshippingresellers.vercel.app/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: attach admin JWT token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("sparepro_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: unwrap response data directly
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message || error.message || "An unexpected error occurred.";
    const code = error.response?.data?.code || "NETWORK_ERROR";
    return Promise.reject({ message, code, status: error.response?.status, response: error.response });
  }
);

// Authentication APIs
export const authApi = {
  login: (credentials) => api.post("/auth/login", credentials),
  getMe: () => api.get("/auth/profile"),
  updateProfile: (data) => api.put("/auth/profile", data),
  changePassword: (data) => api.put("/auth/change-password", data),
};

// Admin Operations APIs
export const adminApi = {
  getDashboardStats: () => api.get("/admin/dashboard/stats"),
  getResellers: (params) => api.get("/admin/resellers", { params }),
  getResellerById: (id) => api.get(`/admin/resellers/${id}`),
  approveReseller: (id) => api.patch(`/admin/resellers/${id}/approve`),
  rejectReseller: (id, reason) => api.patch(`/admin/resellers/${id}/reject`, { reason }),
  toggleResellerStatus: (id, status) => api.patch(`/admin/resellers/${id}/status`, { accountStatus: status }),
  getOrders: (params) => api.get("/admin/orders", { params }),
  updateOrderStatus: (id, orderStatus) => api.patch(`/admin/orders/${id}/status`, { orderStatus }),
  getBalanceSheet: (params) => api.get("/admin/reports/balance-sheet", { params }),
  getSalesReport: (params) => api.get("/admin/reports/sales", { params }),
  getCollectionsReport: (params) => api.get("/admin/reports/collections", { params }),
};

// Products & Inventory APIs
export const productsApi = {
  getAll: (params) => api.get("/products", { params }),
  getBySlug: (slug) => api.get(`/products/${slug}`),
  getCategories: () => api.get("/products/categories/list"),
  create: (data) => api.post("/products", data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

// Orders APIs
export const ordersApi = {
  getAll: (params) => api.get("/admin/orders", { params }),
  getById: (id) => api.get(`/orders/${id}`),
  updateStatus: (id, status) => api.patch(`/admin/orders/${id}/status`, { orderStatus: status }),
};

// Payments & Ledger APIs
export const paymentsApi = {
  getResellerSummary: () => api.get("/payments/reseller-summary"),
  getResellerLedger: (params) => api.get("/payments/reseller-ledger", { params }),
  recordManual: (data) => api.post("/payments/record-manual", data),
  recordAdjustment: (data) => api.post("/payments/adjustment", data),
};

// COD APIs
export const codApi = {
  getPending: (params) => api.get("/cod/pending", { params }),
  markCollected: (id, data) => api.patch(`/cod/${id}/collect`, data),
  updateDeliveryStatus: (id, data) => api.patch(`/cod/${id}/delivery-status`, data),
};

export default api;
