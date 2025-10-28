// API utility functions with authentication

const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/+$/, "") || "/api";

// Get token from localStorage
function getToken(): string | null {
  return localStorage.getItem("auth_token");
}

// Get user from localStorage
function getUser() {
  const userStr = localStorage.getItem("auth_user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

// API request with authentication
export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken();
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // เพิ่ม Authorization header ถ้ามี token
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });
}

// GET request
export async function apiGet(endpoint: string) {
  const response = await apiRequest(endpoint);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `API error: ${response.status}`);
  }
  return response.json();
}

// POST request
export async function apiPost(endpoint: string, data: any) {
  const response = await apiRequest(endpoint, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `API error: ${response.status}`);
  }
  return response.json();
}

// PUT request
export async function apiPut(endpoint: string, data: any) {
  const response = await apiRequest(endpoint, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `API error: ${response.status}`);
  }
  return response.json();
}

// DELETE request
export async function apiDelete(endpoint: string) {
  const response = await apiRequest(endpoint, {
    method: "DELETE",
  });
  if (!response.ok && response.status !== 204) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `API error: ${response.status}`);
  }
  return response.status === 204 ? null : response.json();
}

// ==========================================
// Category API
// ==========================================

export type Category = {
  CatagoryId: number;
  CatagoryName: string;
  CatagoryCode: string;
  CreatedAt: string;
  CreatedBy?: number;
  UpdatedAt: string;
  UpdatedBy?: number;
};

export type CreateCategoryData = {
  CatagoryName: string;
  CatagoryCode: string;
  CreatedBy?: number;
};

export type UpdateCategoryData = {
  CatagoryName?: string;
  CatagoryCode?: string;
  UpdatedBy?: number;
};

// ดูรายการ categories ทั้งหมด
export async function getCategories(): Promise<Category[]> {
  return apiGet("/catagory");
}

// ดู category 1 รายการ
export async function getCategory(id: number): Promise<Category> {
  return apiGet(`/catagory/${id}`);
}

// สร้าง category ใหม่
export async function createCategory(data: CreateCategoryData): Promise<Category> {
  const user = getUser();
  return apiPost("/catagory", {
    ...data,
    CreatedBy: user?.UserId || undefined,
  });
}

// แก้ไข category
export async function updateCategory(id: number, data: UpdateCategoryData): Promise<Category> {
  const user = getUser();
  return apiPut(`/catagory/${id}`, {
    ...data,
    UpdatedBy: user?.UserId || undefined,
  });
}

// ลบ category
export async function deleteCategory(id: number): Promise<void> {
  return apiDelete(`/catagory/${id}`);
}

