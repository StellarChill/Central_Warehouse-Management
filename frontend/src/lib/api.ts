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
export function getUser() {
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
    (headers as any)["Authorization"] = `Bearer ${token}`;
  }

  // Inject WarehouseId if available in user object, otherwise check localStorage (for switched context)
  const user = getUser();
  if (user?.WarehouseId) {
    (headers as any)["x-warehouse-id"] = String(user.WarehouseId);
  } else {
    // Check local storage for selected warehouse context (valid for Admins, Managers, etc.)
    const selectedWh = localStorage.getItem('selected_warehouse_id');
    if (selectedWh && selectedWh !== "all") {
      (headers as any)["x-warehouse-id"] = selectedWh;
    }
  }

  // DEBUG: log request info
  console.debug(`[API] ${options.method || 'GET'} ${API_BASE}${endpoint} | token=${token ? token.substring(0, 20) + '...' : 'NONE'}`);

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  // Auto-logout เฉพาะ 401 (token หมดอายุจริงๆ)
  // ไม่ logout ที่ 403 (token ใช้ได้แต่ role ไม่ถูก)
  if (response.status === 401) {
    // ป้องกัน auto-logout ซ้ำจาก API call หลายตัวพร้อมกัน
    const alreadyLoggingOut = (window as any).__auto_logout_in_progress;
    if (!alreadyLoggingOut && !window.location.pathname.includes('/login')) {
      (window as any).__auto_logout_in_progress = true;
      console.warn(`[API] ❌ 401 on ${endpoint} — token expired, redirecting to login`);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
  }

  return response;
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
// Company Management APIs
// ==========================================

export type Company = {
  CompanyId: number;
  CompanyName: string;
  CompanyCode: string;
  CompanyAddress?: string | null;
  TaxId?: string | null;
  CompanyTelNumber?: string | null;
  CompanyEmail?: string | null;
  CompanyStatus?: string | null;
  CreatedAt: string;
  UpdatedAt: string;
  CreatedBy?: number | null;
  UpdatedBy?: number | null;
};

export type CreateCompanyData = {
  CompanyName: string;
  CompanyCode: string;
  CompanyAddress?: string;
  TaxId?: string;
  CompanyTelNumber?: string;
  CompanyEmail?: string;
};

export type UpdateCompanyData = Partial<CreateCompanyData> & {
  CompanyStatus?: string;
};

export async function getCompanies(): Promise<Company[]> {
  return apiGet('/company');
}

export async function getCompany(id: number): Promise<Company> {
  return apiGet(`/company/${id}`);
}

export async function createCompany(data: CreateCompanyData): Promise<Company> {
  const user = getUser();
  return apiPost('/company', { ...data, CreatedBy: user?.UserId || undefined });
}

export async function updateCompany(id: number, data: UpdateCompanyData): Promise<Company> {
  const user = getUser();
  return apiPut(`/company/${id}`, { ...data, UpdatedBy: user?.UserId || undefined });
}

export async function deleteCompany(id: number): Promise<void> {
  return apiDelete(`/company/${id}`);
}

// ==========================================
// Admin User Management APIs
// ==========================================

export type AdminUser = {
  UserId: number;
  UserName: string;
  Email?: string | null;
  LineId?: string | null;
  RoleId?: number | null;
  BranchId?: number | null;
  BranchName?: string | null;
  UserStatusApprove: 'PENDING' | 'APPROVED' | 'REJECTED';
  UserStatusActive: 'ACTIVE' | 'INACTIVE';
  CreatedAt: string;
  status?: string | null; // Derived status for legacy UIs
};

export type AdminUserFilters = {
  status?: string;
  approve?: 'PENDING' | 'APPROVED' | 'REJECTED';
  active?: 'ACTIVE' | 'INACTIVE';
};

export type AdminApproveUserData = {
  RoleId?: number;
  BranchId?: number;
  BranchName?: string;
  UserStatusApprove?: 'PENDING' | 'APPROVED' | 'REJECTED';
  UserStatusActive?: 'ACTIVE' | 'INACTIVE';
  status?: string;
};

export type AdminUpdateUserData = {
  UserName?: string;
  Email?: string;
  LineId?: string;
  RoleId?: number;
  BranchId?: number;
  UserStatusApprove?: 'PENDING' | 'APPROVED' | 'REJECTED';
  UserStatusActive?: 'ACTIVE' | 'INACTIVE';
};

export async function adminGetUsers(filters?: AdminUserFilters): Promise<AdminUser[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.approve) params.append('approve', filters.approve);
  if (filters?.active) params.append('active', filters.active);
  const query = params.toString();
  return apiGet(`/admin/users${query ? `?${query}` : ''}`);
}

export async function adminApproveUser(id: number, data: AdminApproveUserData): Promise<AdminUser> {
  return apiPost(`/admin/users/${id}/approve`, data);
}

export async function adminUpdateUser(id: number, data: AdminUpdateUserData): Promise<AdminUser> {
  return apiPut(`/admin/users/${id}`, data);
}

export async function adminDeleteUser(id: number): Promise<void> {
  return apiDelete(`/admin/users/${id}`);
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
  Company?: {
    CompanyId: number;
    CompanyName: string;
    CompanyCode: string;
  } | null;
  Branch?: {
    BranchId: number;
    BranchName: string;
    BranchCode: string;
  } | null;
  Role?: {
    RoleId: number;
    RoleName: string;
    RoleCode: string;
  } | null;
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

// Stock Adjustment
export async function createStockAdjustment(data: { WarehouseId: number, MaterialId: number, Quantity: number, Reason?: string }) {
  return apiPost('/stock-adjustments', data);
}

export interface StockAdjustment {
  AdjustmentId: number;
  WarehouseId: number;
  MaterialId: number;
  Quantity: number;
  Reason?: string;
  CreatedAt: string;
  Material?: Material;
  Warehouse?: Warehouse;
  CreatedByUser?: { UserName: string };
}

export async function getStockAdjustments(params?: { warehouseId?: number, materialId?: number }) {
  const ps = new URLSearchParams();
  if (params?.warehouseId) ps.append('warehouseId', String(params.warehouseId));
  if (params?.materialId) ps.append('materialId', String(params.materialId));
  return apiGet(`/stock-adjustments?${ps}`);
}

// List roles (platform admin sees all)
export async function getRoles() {
  return apiGet('/role');
}

// Branches helper already exists: getBranches()

// Assign company/branch/role to a user
export async function platformAssignUser(id: number, data: { CompanyId?: number; BranchId?: number; RoleId?: number }) {
  return apiPost(`/platform/users/${id}/assign`, data);
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
  WithdrawnRequestDetails?: (WithdrawnRequestDetail & { Material?: { MaterialCode: string; MaterialName: string } })[];
};

export type WithdrawnRequestDetail = {
  RequestDetailId: number;
  RequestId: number;
  MaterialId: number;
  WithdrawnQuantity: number;
  Material?: { MaterialCode: string; MaterialName: string };
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

export async function deleteRequisition(id: number) {
  return apiDelete(`/request/${id}`);
}

export async function shipRequisition(id: number) {
  // Create issue from request; server will allocate stock and mark issue
  return apiPost(`/issue/from-request/${id}`, {});
}

export type CreateWithdrawnRequestData = {
  BranchId: number;
  RequestDate?: string;
  details: { MaterialId: number; WithdrawnQuantity: number }[];
};

export async function createWithdrawnRequest(data: CreateWithdrawnRequestData) {
  const user = getUser();
  return apiPost('/request', { ...data, CreatedBy: user?.UserId });
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
  CompanyId: number;
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
// Warehouse API
// ==========================================

export type Warehouse = {
  WarehouseId: number;
  WarehouseName: string;
  WarehouseCode: string;
  WarehouseAddress?: string | null;
  CreatedAt: string;
  UpdatedAt: string;
  CreatedBy?: number;
  UpdatedBy?: number;
};

export type CreateWarehouseData = {
  WarehouseName: string;
  WarehouseCode: string;
  WarehouseAddress?: string;
  CreatedBy?: number;
};

export type UpdateWarehouseData = Partial<CreateWarehouseData>;

export async function getWarehouses(): Promise<Warehouse[]> {
  return apiGet('/warehouse');
}

export async function getWarehouse(id: number): Promise<Warehouse> {
  return apiGet(`/warehouse/${id}`);
}

export async function createWarehouse(data: CreateWarehouseData): Promise<Warehouse> {
  const user = getUser();
  return apiPost('/warehouse', { ...data, CreatedBy: user?.UserId || undefined });
}

export async function updateWarehouse(id: number, data: UpdateWarehouseData): Promise<Warehouse> {
  const user = getUser();
  return apiPut(`/warehouse/${id}`, { ...data, UpdatedBy: user?.UserId || undefined });
}

export async function deleteWarehouse(id: number): Promise<void> {
  return apiDelete(`/warehouse/${id}`);
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
  PurchaseOrderAddress?: string | null;
  CreatedByUser?: { UserName: string } | null;
  _count?: { PurchaseOrderDetails: number };
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
  WarehouseId: number; // Required for stock context
  PurchaseOrderCode?: string; // Optional - backend will auto-generate if not provided
  PurchaseOrderStatus?: PurchaseOrder['PurchaseOrderStatus'];
  PurchaseOrderAddress?: string;
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

export async function getPurchaseOrder(id: number): Promise<PurchaseOrder & { PurchaseOrderDetails: PurchaseOrderDetail[] }> {
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
  WarehouseId?: number; // Added for filtering
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
  WarehouseId?: number;
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
// Issue API (Outbound)
// ==========================================

export type Issue = {
  IssueId: number;
  IssueCode: string;
  IssueDate: string;
  IssueStatus: string;
  CompanyId: number;
  BranchId: number;
  WarehouseId: number;
  WithdrawnRequestId: number;
  CreatedAt: string;
};

export type IssueDetail = {
  IssueDetailId: number;
  IssueId: number;
  MaterialId: number;
  IssueQuantity: number;
};

export async function getIssues(): Promise<Issue[]> {
  return apiGet('/issue');
}

export async function getIssue(id: number): Promise<Issue & { IssueDetails: IssueDetail[] }> {
  return apiGet(`/issue/${id}`);
}

// ==========================================
// Stock API
// ==========================================

export type Stock = {
  StockId: number;
  MaterialId: number;
  MaterialName: string;
  MaterialCode?: string;
  Unit: string;
  Quantity: number;
  Remain: number;
  StockPrice: number;
  Barcode: string;
  ReceiptId: number;
  PurchaseOrderId: number;
  WarehouseId: number;
  CreatedAt: string;
  Material?: {
    MaterialId: number;
    MaterialName: string;
    MaterialCode: string;
    Unit: string;
  };
};

export type StockSummaryRow = {
  MaterialId: number;
  MaterialName: string;
  Unit: string;
  TotalQuantity: number;
  TotalRemain: number;
};

type WarehouseScopedParams = {
  warehouseId?: number;
};

const buildWarehouseQuery = (params?: WarehouseScopedParams) => {
  if (!params?.warehouseId) return "";
  const id = Number(params.warehouseId);
  if (!Number.isFinite(id) || id <= 0) return "";
  return `?warehouseId=${id}`;
};

export async function getStocks(params?: WarehouseScopedParams): Promise<Stock[]> {
  const qs = buildWarehouseQuery(params);
  return apiGet(`/stock${qs}`);
}

export async function getStockSummary(params?: WarehouseScopedParams): Promise<StockSummaryRow[]> {
  const qs = buildWarehouseQuery(params);
  return apiGet(`/stock/summary${qs}`);
}
