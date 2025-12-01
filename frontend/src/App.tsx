// src/App.tsx
import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { AuthProvider, useAuth, Role } from "./context/AuthContext";
import { StockProvider } from "./context/StockContext";
import { getWarehouses, type Warehouse } from "./lib/api";

// ---- Code-split pages (improves first-load perf) ----
// Legacy dashboard kept but not used as root; routing now uses role landing
const DashboardPage = lazy(() => import("./pages/shared/DashboardPage"));
const PurchaseOrdersPage = lazy(() => import("./pages/inventory/PurchaseOrdersPage"));
const InventoryPage = lazy(() => import("./pages/inventory/InventoryPage"));
const SuppliersPage = lazy(() => import("./pages/inventory/SuppliersPage"));
const RequisitionsPage = lazy(() => import("./pages/branch/RequisitionsPage"));
const ReceivingPage = lazy(() => import("./pages/inventory/ReceivingPage"));
const ProductsPage = lazy(() => import("./pages/inventory/ProductsPage"));
const CategoriesManagePage = lazy(() => import("./pages/inventory/CategoriesManagePage"));
const BranchRequisitionCreatePage = lazy(
  () => import("./pages/branch/BranchRequisitionCreatePage")
);
const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsersPage"));
const AdminBranchesPage = lazy(() => import("./pages/admin/AdminBranchesPage"));
const AdminReportsPage = lazy(() => import("./pages/admin/AdminReportsPage"));
const AdminHomePage = lazy(() => import("./pages/admin/AdminHomePage"));
const AuthPage = lazy(() => import("./pages/auth/AuthPage"));
const RegisterLandingPage = lazy(() => import("./pages/auth/RegisterLandingPage"));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage"));
const LiffRegisterPage = lazy(() => import("./pages/auth/LiffRegisterPage"));
const WaitingApprovalPage = lazy(() => import("./pages/company/WaitingApprovalPage"));
const UserStatusPage = lazy(() => import("./pages/company/UserStatusPage"));
const NotFound = lazy(() => import("./pages/shared/NotFound"));
const PlatformDashboardPage = lazy(() => import("./pages/platform/PlatformDashboardPage"));
const PlatformCompaniesPage = lazy(() => import("./pages/platform/PlatformCompaniesPage"));
const PlatformApprovalsPage = lazy(() => import("./pages/platform/PlatformApprovalsPage"));
const CompanyDashboardPage = lazy(() => import("./pages/company/CompanyDashboardPage"));
const BranchDashboardPage = lazy(() => import("./pages/branch/BranchDashboardPage"));
const CompanyRegisterPage = lazy(() => import("./pages/auth/CompanyRegisterPage"));
const HomePage = lazy(() => import("./pages/shared/HomePage"));
const WarehouseManagementPage = lazy(() => import("./pages/warehouse/WarehouseManagementPage"));
const WarehouseDetailPage = lazy(() => import("./pages/warehouse/WarehouseDetailPage"));
const WarehouseDashboardPage = lazy(() => import("./pages/warehouse/WarehouseDashboardPage"));

// ---- React Query sane defaults ----
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      {/* If you use both, you may get duplicate toasts; keep both only if intentional */}
      <Toaster />
      <Sonner />
      <AuthProvider>
        <StockProvider>
          <BrowserRouter>
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                {/* Auth (login + register in one page) */}
                <Route path="/login" element={<AuthPage />} />
                
                {/* Public routes */}
                <Route path="/register" element={<RegisterLandingPage />} />
                <Route path="/register/user" element={<RegisterPage />} />
                {/* Company self-service registration */}
                <Route path="/register-company" element={<CompanyRegisterPage />} />
                <Route path="/liff" element={<LiffRegisterPage />} />
                <Route path="/awaiting-approval" element={<WaitingApprovalPage />} />

                {/* Root route - shows login if not authenticated; renders layout for all nested routes */}
                <Route path="/" element={<RootRoute />}>
                  {/* Index redirects user to appropriate portal based on role */}
                  <Route index element={<RoleLanding />} />
                  <Route path="user-status" element={<UserStatusPage />} />
                  <Route path="suppliers" element={<SuppliersPage />} />
                  <Route path="ingredients" element={<ProductsPage />} />
                  <Route path="categories" element={<CategoriesManagePage />} />
                  <Route path="inventory" element={<InventoryPage />} />
                  <Route path="purchase-orders" element={<PurchaseOrdersPage />} />
                  <Route
                    path="requisitions/create"
                    element={<BranchRequisitionCreatePage />}
                  />
                  <Route path="receiving" element={<ReceivingPage />} />
                  <Route path="requisitions" element={<RequisitionsPage />} />
                  {/* Platform admin portal */}
                  <Route
                    path="platform"
                    element={
                      <Guard allow={["PLATFORM_ADMIN"]}>
                        <PlatformDashboardPage />
                      </Guard>
                    }
                  />
                  <Route
                    path="platform/companies"
                    element={
                      <Guard allow={["PLATFORM_ADMIN"]}>
                        <PlatformCompaniesPage />
                      </Guard>
                    }
                  />
                  <Route
                    path="platform/approvals"
                    element={
                      <Guard allow={["PLATFORM_ADMIN"]}>
                        <PlatformApprovalsPage />
                      </Guard>
                    }
                  />
                  <Route
                    path="platform/users"
                    element={
                      <Guard allow={["PLATFORM_ADMIN"]}>
                        <PlatformApprovalsPage />
                      </Guard>
                    }
                  />

                  {/* Company admin portal */}
                  <Route
                    path="admin"
                    element={
                      <Guard allow={["COMPANY_ADMIN", "ADMIN"]}>
                        <CompanyDashboardPage />
                      </Guard>
                    }
                  />

                  {/* Branch/Warehouse portal */}
                  <Route
                    path="branch"
                    element={
                      <Guard allow={["BRANCH_MANAGER", "BRANCH_USER", "CENTER", "BRANCH", "WAREHOUSE_ADMIN"]}>
                        <BranchDashboardPage />
                      </Guard>
                    }
                  />
                  <Route
                    path="admin"
                    element={
                      <Guard allow={["ADMIN"]}>
                        <AdminHomePage />
                      </Guard>
                    }
                  />
                  <Route
                    path="admin/users"
                    element={
                      <Guard allow={["ADMIN"]}>
                        <AdminUsersPage />
                      </Guard>
                    }
                  />
                  <Route
                    path="admin/branches"
                    element={
                      <Guard allow={["ADMIN"]}>
                        <AdminBranchesPage />
                      </Guard>
                    }
                  />
                  {/* Removed audit logs route */}
                  <Route
                    path="admin/reports"
                    element={
                      <Guard allow={["ADMIN"]}>
                        <AdminReportsPage />
                      </Guard>
                    }
                  />
                  <Route
                    path="/warehouse-management"
                    element={
                      <Guard allow={["COMPANY_ADMIN", "ADMIN"]}>
                        <WarehouseManagementPage />
                      </Guard>
                    }
                  />
                  <Route path="/warehouse/:id" element={<WarehouseDetailPage />} />
                  <Route path="/warehouse/:id/dashboard" element={<WarehouseDashboardPage />} />
                </Route>

                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </StockProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

// ---- Loading screen ----
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

// ---- RootRoute: แสดง login ถ้ายังไม่ได้ login, dashboard ถ้า login แล้ว ----
function RootRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // ถ้ากำลังโหลดข้อมูล user จาก localStorage ให้แสดง loading
  if (isLoading) {
    return <LoadingScreen />;
  }

  // ถ้ายัง login ไม่ได้ แสดง login page
  if (!user) {
    return <HomePage />;
  }

  // ถ้า login แล้ว แสดง AppLayout และ nested routes
  return (
    <AppLayout />
  );
}

// ---- ProtectedRoute: ป้องกันการเข้าถึงถ้ายัง login ไม่ได้ ----
function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // ถ้ากำลังโหลดข้อมูล user จาก localStorage ให้แสดง loading
  if (isLoading) {
    return <LoadingScreen />;
  }

  // ถ้ายัง login ไม่ได้ redirect ไป root (จะแสดง login page)
  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
}

// ---- Guard: ป้องกันการเข้าถึงตาม role ----
function Guard({
  allow,
  children,
}: {
  allow: Role[];
  children: JSX.Element;
}) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return allow.includes(user.role) ? children : <NotFound />;
}

export default App;

// Role-based landing at index path only
function RoleLanding() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'PLATFORM_ADMIN') return <Navigate to="/platform" replace />;
  if (['COMPANY_ADMIN', 'ADMIN', 'WAREHOUSE_ADMIN'].includes(user.role)) {
    return <CompanyWarehouseLanding />;
  }
  return <Navigate to="/inventory" replace />;
}

function CompanyWarehouseLanding() {
  const { data, isLoading, isError } = useQuery<Warehouse[]>({
    queryKey: ['warehouses', 'landing'],
    queryFn: getWarehouses,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <LoadingScreen />;

  if (isError || !data || data.length === 0) {
    return <Navigate to="/warehouse-management" replace />;
  }

  const preferred =
    data.find((w) => w.WarehouseName?.toLowerCase().includes('main')) ||
    data.find((w) => w.WarehouseCode?.toLowerCase().includes('main')) ||
    data[0];

  return <Navigate to={`/warehouse/${preferred.WarehouseId}/dashboard`} replace />;
}

