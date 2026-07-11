const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface FetchOptions extends RequestInit {
  params?: Record<string, string | boolean | undefined>;
}

async function fetchApi(endpoint: string, options: FetchOptions = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  // URL parameters handling
  let url = `${BASE_URL}${endpoint}`;
  if (options.params) {
    const searchParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        searchParams.append(key, String(val));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = "حدث خطأ ما في الخادم";
    try {
      const errorJson = await response.json();
      errorMessage = errorJson.detail || errorMessage;
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }

  if (response.headers.get("content-type")?.includes("application/json")) {
    return response.json();
  }
  return response;
}

export const api = {
  // --- Auth ---
  auth: {
    async login(formData: URLSearchParams) {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });
      if (!res.ok) {
        let msg = "فشل تسجيل الدخول";
        try {
          const js = await res.json();
          msg = js.detail || msg;
        } catch {}
        throw new Error(msg);
      }
      return res.json();
    },
    async getMe() {
      return fetchApi("/api/auth/me");
    },
    async changePassword(data: any) {
      return fetchApi("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    async updateProfile(data: { username: string; password?: string; old_password?: string }) {
      return fetchApi("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    }
  },

  // --- Products ---
  products: {
    async getAll(params?: { search?: string; category?: string; low_stock?: boolean }) {
      return fetchApi("/api/products", { params });
    },
    async getById(id: number) {
      return fetchApi(`/api/products/${id}`);
    },
    async create(data: any) {
      return fetchApi("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    async update(id: number, data: any) {
      return fetchApi(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    async delete(id: number) {
      return fetchApi(`/api/products/${id}`, {
        method: "DELETE",
      });
    }
  },

  // --- Customers ---
  customers: {
    async getAll(params?: { search?: string }) {
      return fetchApi("/api/customers", { params });
    },
    async getById(id: number) {
      return fetchApi(`/api/customers/${id}`);
    },
    async create(data: any) {
      return fetchApi("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    async update(id: number, data: any) {
      return fetchApi(`/api/customers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    async delete(id: number) {
      return fetchApi(`/api/customers/${id}`, {
        method: "DELETE",
      });
    },
    async addPayment(customerId: number, data: { amount: number; notes?: string }) {
      return fetchApi(`/api/customers/${customerId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    async getPayments(customerId: number) {
      return fetchApi(`/api/customers/${customerId}/payments`);
    }
  },

  // --- Sales ---
  sales: {
    async getAll() {
      return fetchApi("/api/sales");
    },
    async create(data: { customer_id?: number; paid_amount: number; sale_type: string; due_date?: string; notes?: string; items: any[] }) {
      return fetchApi("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    }
  },

  // --- Purchases ---
  purchases: {
    async getAll() {
      return fetchApi("/api/purchases");
    },
    async create(data: { supplier: string; invoice_number: string; notes?: string; items: any[] }) {
      return fetchApi("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    }
  },

  // --- Cash ---
  cash: {
    async getSummary() {
      return fetchApi("/api/cash/summary");
    },
    async addExpense(data: { amount: number; description: string; notes?: string }) {
      return fetchApi("/api/cash/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    async getHistory() {
      return fetchApi("/api/cash/history");
    }
  },

  // --- Debts ---
  debts: {
    async getAll(params?: { search?: string }) {
      return fetchApi("/api/debts", { params });
    },
    async addDebt(data: { customer_id: number; amount: number; due_date?: string; notes?: string }) {
      return fetchApi(`/api/debts/add?customer_id=${data.customer_id}&amount=${data.amount}` + 
        (data.due_date ? `&due_date=${data.due_date}` : '') + 
        (data.notes ? `&notes=${encodeURIComponent(data.notes)}` : ''), {
        method: "POST"
      });
    }
  },

  // --- Reports ---
  reports: {
    async getSummary(params: { range_type: string; custom_start?: string; custom_end?: string }) {
      return fetchApi("/api/reports/summary", { params });
    },
    getExcelUrl(range_type: string, custom_start?: string, custom_end?: string) {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
      let url = `${BASE_URL}/api/reports/export/excel?range_type=${range_type}&token=${token}`;
      if (custom_start) url += `&custom_start=${custom_start}`;
      if (custom_end) url += `&custom_end=${custom_end}`;
      return url;
    }
  },

  // --- Notifications ---
  notifications: {
    async getAll() {
      return fetchApi("/api/notifications");
    },
    async markRead(id: number) {
      return fetchApi(`/api/notifications/${id}/read`, {
        method: "PUT",
      });
    },
    async markReadAll() {
      return fetchApi("/api/notifications/read-all", {
        method: "PUT",
      });
    }
  },

  // --- Settings ---
  settings: {
    async get() {
      return fetchApi("/api/settings");
    },
    async update(data: any) {
      return fetchApi("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    getBackupUrl() {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
      return `${BASE_URL}/api/settings/backup?token=${token}`;
    },
    async restore(file: File) {
      const formData = new FormData();
      formData.append("file", file);
      
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers = new Headers();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      
      const res = await fetch(`${BASE_URL}/api/settings/restore`, {
        method: "POST",
        headers,
        body: formData
      });
      
      if (!res.ok) {
        throw new Error("فشل استعادة قاعدة البيانات");
      }
      return res.json();
    }
  }
};
export default api;
export { BASE_URL };
