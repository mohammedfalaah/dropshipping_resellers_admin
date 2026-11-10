import axios from "axios";

// Default to local backend if running on localhost, otherwise production Vercel
const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (isLocalhost ? "http://localhost:5001/api" : "https://thesparepro.com/api");

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
    const errors =
      error.response?.data?.errors ||
      error.response?.data?.data ||
      (Array.isArray(error.response?.data) ? error.response.data : null);

    return Promise.reject({
      message,
      code,
      errors,
      status: error.response?.status,
      response: error.response,
    });
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
  updateOrderCodCollection: (id, data) => api.patch(`/admin/orders/${id}/cod-collection`, data),
  getBalanceSheet: (params) => api.get("/admin/reports/balance-sheet", { params }),
  getSalesReport: (params) => api.get("/admin/reports/sales", { params }),
  getCollectionsReport: (params) => api.get("/admin/reports/collections", { params }),
  getSettings: () => api.get("/admin/settings"),
  updateSettings: (data) => api.put("/admin/settings", data),
};

// Categories APIs
export const categoriesApi = {
  getAll: (params) => api.get("/admin/categories", { params }),
  getPublic: () => api.get("/categories"),
  create: (data) => api.post("/admin/categories", data),
  update: (id, data) => api.put(`/admin/categories/${id}`, data),
  delete: (id, params) => api.delete(`/admin/categories/${id}`, { params }),
};

// Products & Inventory APIs
export const productsApi = {
  getAll: (params) => api.get("/products", { params }),
  getBySlug: (slug) => api.get(`/products/${slug}`),
  getCategories: () => api.get("/admin/categories"),
  create: (data) => api.post("/products", data),
  update: (id, data) =>
    api.patch(`/products/${id}`, data).catch((err) => {
      if (err?.status === 404 || err?.status === 405) {
        return api.put(`/products/${id}`, data);
      }
      return Promise.reject(err);
    }),
  delete: (id) => api.delete(`/products/${id}`),
  deleteAll: () => api.delete("/products/clear-all"),
  uploadImage: (formData) =>
    api.post("/products/upload-image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  bulkImport: (products) => api.post("/products/import", { products }),
};


// Orders APIs
export const ordersApi = {
  getAll: (params) => api.get("/admin/orders", { params }),
  getById: (id) => api.get(`/orders/${id}`),
  updateStatus: (id, status) => api.patch(`/admin/orders/${id}/status`, { orderStatus: status }),
  updateCodCollection: (id, data) => api.patch(`/admin/orders/${id}/cod-collection`, data),
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
  getMyCodOrders: (params) => api.get("/cod/my-cod-orders", { params }),
  markCollected: (id, data) => api.patch(`/cod/${id}/collect`, data),
  reconcile: (id, data) => api.patch(`/cod/${id}/reconcile`, data),
  settleProfit: (id, data) => api.post(`/cod/${id}/settle`, data),
  updateDeliveryStatus: (id, data) => api.patch(`/cod/${id}/delivery-status`, data),
};

// Settings APIs
export const settingsApi = {
  getPublic: () => api.get("/settings/public"),
  getAdmin: () => api.get("/admin/settings"),
  updateAdmin: (data) => api.put("/admin/settings", data),
};

export default api;
