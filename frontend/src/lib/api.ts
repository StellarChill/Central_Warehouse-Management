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
// Platform Admin APIs
// ==========================================

export type PlatformSignupUser = {
  UserId: number;
  UserName: string;
  Email?: string | null;
  TelNumber?: string | null;
  LineId?: string | null;
  RequestedRoleText?: string | null;
  TempCompanyId?: number | null;
  UserStatusApprove: 'PENDING' | 'APPROVED' | 'REJECTED';
  UserStatusActive: 'ACTIVE' | 'INACTIVE';
  CreatedAt: string;
  TempCompany?: {
    TempCompanyId: number;
    TempCompanyName: string;
    TempCompanyCode: string;
    TempCompanyAddress?: string | null;
    TempCompanyTaxId?: string | null;
    TempCompanyTelNumber?: string | null;
    TempCompanyEmail?: string | null;
  } | null;
};

export async function platformListUsers(status: 'PENDING' | 'APPROVED' | 'REJECTED' = 'PENDING') {
  const q = encodeURIComponent(status);
  return apiGet(`/platform/users/pending?status=${q}`) as Promise<PlatformSignupUser[]>;
}

export async function platformApproveUser(id: number) {
  return apiPost(`/platform/users/${id}/approve`, { action: 'APPROVE' });
}

export async function platformRejectUser(id: number) {
  return apiPost(`/platform/users/${id}/approve`, { action: 'REJECT' });
}

export async function platformSetUserActive(id: number, status: 'ACTIVE' | 'INACTIVE') {
  return apiPost(`/platform/users/${id}/active`, { status });
}

// ==========================================
// Requisitions (Withdrawn Requests)
// ==========================================

export type WithdrawnRequest = {
  RequestId: number;
  RequestDate: string;
  WithdrawnRequestStatus: string;
  BranchId: number;
  WithdrawnRequestCode: string;
  CreatedAt: string;
  UpdatedAt: string;
  CreatedBy?: number | null;
  UpdatedBy?: number | null;
};

export type WithdrawnRequestDetail = {
  RequestDetailId: number;
  RequestId: number;
  MaterialId: number;
  WithdrawnQuantity: number;
};

export async function getRequisitions(): Promise<WithdrawnRequest[]> {
  return apiGet('/request');
}

export async function getRequisition(id: number): Promise<WithdrawnRequest & { WithdrawnRequestDetails: WithdrawnRequestDetail[] }> {
  return apiGet(`/request/${id}`);
}

export async function approveRequisition(id: number) {
  const user = getUser();
  return apiPut(`/request/${id}`, { WithdrawnRequestStatus: 'APPROVED', UpdatedBy: user?.UserId || undefined });
}

export async function rejectRequisition(id: number) {
  const user = getUser();
  return apiPut(`/request/${id}`, { WithdrawnRequestStatus: 'REJECTED', UpdatedBy: user?.UserId || undefined });
}

export async function shipRequisition(id: number) {
  // Create issue from request; server will allocate stock and mark issue
  return apiPost(`/issue/from-request/${id}`, {});
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


// ==========================================
// Supplier API
// ==========================================

export type Supplier = {
  SupplierId: number;
  SupplierName: string;
  SupplierAddress?: string | null;
  SupplierCode: string;
  SupplierTelNumber?: string | null;
  CreatedAt: string;
  UpdatedAt: string;
  CreatedBy?: number;
  UpdatedBy?: number;
};

export type CreateSupplierData = {
  SupplierName: string;
  SupplierCode: string;
  SupplierAddress?: string;
  SupplierTelNumber?: string;
};

export type UpdateSupplierData = Partial<CreateSupplierData>;

export async function getSuppliers(): Promise<Supplier[]> {
  return apiGet('/supplier');
}

export async function getSupplier(id: number): Promise<Supplier> {
  return apiGet(`/supplier/${id}`);
}

export async function createSupplier(data: CreateSupplierData): Promise<Supplier> {
  const user = getUser();
  return apiPost('/supplier', { ...data, CreatedBy: user?.UserId || undefined });
}

export async function updateSupplier(id: number, data: UpdateSupplierData): Promise<Supplier> {
  const user = getUser();
  return apiPut(`/supplier/${id}`, { ...data, UpdatedBy: user?.UserId || undefined });
}

export async function deleteSupplier(id: number): Promise<void> {
  return apiDelete(`/supplier/${id}`);
}

// ==========================================
// Purchase Order API
// ==========================================

export type PurchaseOrder = {
  PurchaseOrderId: number;
  SupplierId: number;
  PurchaseOrderCode: string;
  PurchaseOrderStatus: 'DRAFT' | 'SENT' | 'CONFIRMED' | 'RECEIVED';
  TotalPrice: number;
  DateTime: string;
  CreatedAt: string;
  UpdatedAt: string;
  Supplier?: { SupplierName: string };
};

export type PurchaseOrderDetail = {
  PurchaseOrderDetailId: number;
  PurchaseOrderId: number;
  MaterialId: number;
  PurchaseOrderQuantity: number;
  PurchaseOrderPrice: number;
  PurchaseOrderUnit: string;
};

export type CreatePurchaseOrderData = {
  SupplierId: number;
  PurchaseOrderCode: string;
  PurchaseOrderStatus?: PurchaseOrder['PurchaseOrderStatus'];
  DateTime?: string;
  details: Array<{
    MaterialId: number;
    PurchaseOrderQuantity: number;
    PurchaseOrderPrice: number;
    PurchaseOrderUnit: string;
  }>;
};

export type UpdatePurchaseOrderData = Partial<Omit<CreatePurchaseOrderData, 'SupplierId' | 'PurchaseOrderCode'>> & {
  details?: CreatePurchaseOrderData['details'];
};

export async function getPurchaseOrders(): Promise<PurchaseOrder[]> {
  return apiGet('/po');
}

export async function getPurchaseOrder(id: number): Promise<PurchaseOrder & { PurchaseOrderDetails: PurchaseOrderDetail[] }>{
  return apiGet(`/po/${id}`);
}

export async function createPurchaseOrder(data: CreatePurchaseOrderData) {
  const user = getUser();
  return apiPost('/po', { ...data, CreatedBy: user?.UserId || undefined });
}

export async function updatePurchaseOrder(id: number, data: UpdatePurchaseOrderData) {
  const user = getUser();
  return apiPut(`/po/${id}`, { ...data, UpdatedBy: user?.UserId || undefined });
}

export async function updatePurchaseOrderStatus(id: number, status: PurchaseOrder['PurchaseOrderStatus']) {
  return apiPut(`/po/${id}/status`, { PurchaseOrderStatus: status });
}

export async function deletePurchaseOrder(id: number) {
  return apiDelete(`/po/${id}`);
}

// ==========================================
// Receipt API
// ==========================================

export type Receipt = {
  ReceiptId: number;
  ReceiptCode: string;
  ReceiptDateTime: string;
  ReceiptTotalPrice: number;
  PurchaseOrderId: number;
  PurchaseOrderCode?: string;
  CreatedAt: string;
  UpdatedAt: string;
};

export type ReceiptDetail = {
  ReceiptDetailId: number;
  ReceiptId: number;
  PurchaseOrderDetailId: number;
  MaterialId: number;
  MaterialQuantity: number;
};

export type CreateReceiptData = {
  PurchaseOrderId: number;
  ReceiptCode: string;
  ReceiptDateTime?: string;
  details: Array<{ MaterialId: number; MaterialQuantity: number; }>;
};

export type UpdateReceiptData = Partial<Omit<CreateReceiptData, 'PurchaseOrderId' | 'ReceiptCode'>> & {
  details?: Array<{ MaterialId: number; MaterialQuantity: number; }>;
};

export async function getReceipts(): Promise<Receipt[]> {
  return apiGet('/receipt');
}

export async function getReceipt(id: number): Promise<Receipt & { ReceiptDetails: ReceiptDetail[] }> {
  return apiGet(`/receipt/${id}`);
}

export async function createReceipt(data: CreateReceiptData) {
  const user = getUser();
  return apiPost('/receipt', { ...data, CreatedBy: user?.UserId || undefined });
}

export async function updateReceipt(id: number, data: UpdateReceiptData) {
  const user = getUser();
  return apiPut(`/receipt/${id}`, { ...data, UpdatedBy: user?.UserId || undefined });
}

export async function deleteReceipt(id: number) {
  return apiDelete(`/receipt/${id}`);
}

// ==========================================
// Stock API
// ==========================================

export type Stock = {
  StockId: number;
  MaterialId: number;
  MaterialName: string;
  Unit: string;
  Quantity: number;
  Remain: number;
  StockPrice: number;
  Barcode: string;
  ReceiptId: number;
  PurchaseOrderId: number;
  CreatedAt: string;
};

export type StockSummaryRow = {
  MaterialId: number;
  MaterialName: string;
  Unit: string;
  TotalQuantity: number;
  TotalRemain: number;
};

export async function getStocks(): Promise<Stock[]> {
  return apiGet('/stock');
}

export async function getStockSummary(): Promise<StockSummaryRow[]> {
  return apiGet('/stock/summary');
}
