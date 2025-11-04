// API utility functions with authentication

// ตั้งค่า API base URL
// ถ้ามี VITE_API_URL ใช้ตามนั้น (ควรมี /api ตอนท้าย)
// ถ้าไม่มี ใช้ /api สำหรับ development (จะใช้ proxy ใน vite.config.ts)
const getApiBase = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    // ลบ trailing slash และตรวจสอบว่า URL มี /api หรือไม่
    const cleanUrl = envUrl.replace(/\/+$/, "");
    // ถ้า URL ไม่มี /api ตอนท้าย ให้เพิ่ม /api
    if (!cleanUrl.endsWith('/api')) {
      return `${cleanUrl}/api`;
    }
    return cleanUrl;
  }
  return "/api";
};

const API_BASE = getApiBase();

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
// Branch API
// ==========================================

// Helper to get authenticated user
function getAuthUser() {
  return getUser();
}

export type Branch = {
  BranchId: number;
  BranchName: string;
  BranchCode: string;
  BranchAddress: string | null;
  CreatedAt: string;
  UpdatedAt: string;
  CreatedBy: number;
  UpdatedBy: number;
};

export type CreateBranchData = {
  BranchName: string;
  BranchCode: string;
  BranchAddress?: string;
};

export type UpdateBranchData = Partial<CreateBranchData>;

export async function getBranches(): Promise<Branch[]> {
  return apiGet('/branch');
}

export async function getBranch(id: number): Promise<Branch> {
  return apiGet(`/branch/${id}`);
}

export async function createBranch(data: CreateBranchData): Promise<Branch> {
  const user = getAuthUser();
  return apiPost('/branch', { ...data, CreatedBy: user?.UserId });
}

export async function updateBranch(id: number, data: UpdateBranchData): Promise<Branch> {
  const user = getAuthUser();
  return apiPut(`/branch/${id}`, { ...data, UpdatedBy: user?.UserId });
}

export async function deleteBranch(id: number): Promise<void> {
  return apiDelete(`/branch/${id}`);
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

// ==========================================
// Material API
// ==========================================

export type Material = {
  MaterialId: number;
  MaterialName: string;
  Unit: string;
  Price: number;
  CatagoryId: number;
  MaterialCode: string;
  CreatedAt: string;
  CreatedBy?: number;
  UpdatedAt: string;
  UpdatedBy?: number;
};

export type CreateMaterialData = {
  MaterialName: string;
  Unit: string;
  Price: number;
  CatagoryId: number;
  MaterialCode: string;
  CreatedBy?: number;
};

export type UpdateMaterialData = {
  MaterialName?: string;
  Unit?: string;
  Price?: number;
  CatagoryId?: number;
  MaterialCode?: string;
  UpdatedBy?: number;
};

// ดูรายการ materials ทั้งหมด
export async function getMaterials(): Promise<Material[]> {
  return apiGet("/material");
}

// ดู material 1 รายการ
export async function getMaterial(id: number): Promise<Material> {
  return apiGet(`/material/${id}`);
}

// สร้าง material ใหม่
export async function createMaterial(data: CreateMaterialData): Promise<Material> {
  const user = getUser();
  return apiPost("/material", {
    ...data,
    CreatedBy: user?.UserId || undefined,
  });
}

// แก้ไข material
export async function updateMaterial(id: number, data: UpdateMaterialData): Promise<Material> {
  const user = getUser();
  return apiPut(`/material/${id}`, {
    ...data,
    UpdatedBy: user?.UserId || undefined,
  });
}

// ลบ material
export async function deleteMaterial(id: number): Promise<void> {
  return apiDelete(`/material/${id}`);
}

