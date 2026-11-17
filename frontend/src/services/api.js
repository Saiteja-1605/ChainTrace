const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, "")}/api`
  : "/api";

function getHeaders(customHeaders = {}) {
  const token = localStorage.getItem("chaintrace_token");
  const headers = {
    "Content-Type": "application/json",
    ...customHeaders,
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: getHeaders(options.headers),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  // Auth
  login: (email, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  getCurrentUser: () => request("/auth/me"),
  getDemoAccounts: () => request("/auth/demo-accounts"),
  getUsers: () => request("/auth/users"),
  createUser: (userData) =>
    request("/auth/users", {
      method: "POST",
      body: JSON.stringify(userData),
    }),

  // Products
  getProducts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/products${query ? `?${query}` : ""}`);
  },

  getProduct: (id) => request(`/products/${encodeURIComponent(id)}`),

  registerProduct: (payload) =>
    request("/products", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateProductStatus: (id, payload) =>
    request(`/products/${encodeURIComponent(id)}/status`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  transferCustody: (id, payload) =>
    request(`/products/${encodeURIComponent(id)}/transfer`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Public Tracking & Verification
  getTracking: (productId) => request(`/tracking/${encodeURIComponent(productId)}`),

  // Blockchain Explorer
  getBlockchainStatus: () => request("/blockchain/status"),
  getBlockchainTransactions: () => request("/blockchain/transactions"),
  getTransactionReceipt: (txHash) => request(`/blockchain/tx/${encodeURIComponent(txHash)}`),

  // Analytics
  getAnalyticsSummary: () => request("/analytics/summary"),
};
