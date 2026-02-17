// src/App.tsx
import React, { Suspense, lazy, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
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
const InventoryIssuingPage = lazy(() => import("./pages/inventory/InventoryIssuingPage"));
// const StockAdjustmentPage = lazy(() => import("./pages/inventory/StockAdjustmentPage"));
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
const LiffEntryPage = lazy(() => import("./pages/liff/LiffEntryPage"));
const LiffCreateRequisitionPage = lazy(() => import("./pages/liff/LiffCreateRequisitionPage"));
const CompanyRegisterPage = lazy(() => import("./pages/auth/CompanyRegisterPage"));
const HomePage = lazy(() => import("./pages/shared/HomePage"));
const WarehouseManagementPage = lazy(() => import("./pages/warehouse/WarehouseManagementPage"));
const WarehouseDetailPage = lazy(() => import("./pages/warehouse/WarehouseDetailPage"));
const WarehouseDashboardPage = lazy(() => import("./pages/warehouse/WarehouseDashboardPage"));
const WarehouseSelectPage = lazy(() => import("./pages/warehouse/WarehouseSelectPage"));

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

                {/* LIFF Entry Points */}
                <Route path="/liff" element={<LiffEntryPage />} />
                <Route path="/liff/register" element={<LiffRegisterPage />} />
                <Route path="/liff/create" element={<LiffCreateRequisitionPage />} />

                <Route path="/awaiting-approval" element={<WaitingApprovalPage />} />

                {/* Mobile Requisition Page (No Dashboard Layout) */}
                <Route
                  path="/requisitions/create"
                  element={
                    <ProtectedRoute>
                      <BranchRequisitionCreatePage />
                    </ProtectedRoute>
                  }
                />

                {/* Root route - shows login if not authenticated; renders layout for all nested routes */}
                <Route path="/" element={<RootRoute />}>
                  {/* Index redirects user to appropriate portal based on role */}
                  <Route index element={<RoleLanding />} />
                  <Route path="user-status" element={<UserStatusPage />} />
                  <Route path="suppliers" element={<SuppliersPage />} />
                  <Route path="ingredients" element={<ProductsPage />} />
                  <Route path="categories" element={<CategoriesManagePage />} />
                  <Route
                    path="inventory"
                    element={
                      <Guard allow={["ADMIN", "COMPANY_ADMIN", "WH_MANAGER", "WAREHOUSE_ADMIN", "PLATFORM_ADMIN"]}>
                        <InventoryPage />
                      </Guard>
                    }
                  />
                  <Route
                    path="inventory/issuing"
                    element={
                      <Guard allow={["ADMIN", "COMPANY_ADMIN", "WH_MANAGER", "WAREHOUSE_ADMIN", "PLATFORM_ADMIN"]}>
                        <InventoryIssuingPage />
                      </Guard>
                    }
                  />
                  <Route
                    path="purchase-orders"
                    element={
                      <Guard allow={["ADMIN", "COMPANY_ADMIN", "WH_MANAGER", "WAREHOUSE_ADMIN", "PLATFORM_ADMIN"]}>
                        <PurchaseOrdersPage />
                      </Guard>
                    }
                  />
                  <Route
                    path="receiving"
                    element={
                      <Guard allow={["ADMIN", "COMPANY_ADMIN", "WH_MANAGER", "WAREHOUSE_ADMIN", "PLATFORM_ADMIN"]}>
                        <ReceivingPage />
                      </Guard>
                    }
                  />
                  {/* <Route path="inventory/adjustment" element={<StockAdjustmentPage />} /> */}
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
                      <Guard allow={["COMPANY_ADMIN", "ADMIN", "WH_MANAGER"]}>
                        <CompanyDashboardPage />
                      </Guard>
                    }
                  />
                  <Route
                    path="/dashboard"
                    element={
                      <Guard allow={["COMPANY_ADMIN", "ADMIN", "WH_MANAGER", "WAREHOUSE_ADMIN"]}>
                        <SmartDashboard />
                      </Guard>
                    }
                  />

                  {/* Branch/Warehouse portal */}
                  <Route
                    path="branch"
                    element={
                      <Guard allow={["BRANCH_MANAGER", "BRANCH_USER", "CENTER", "BRANCH", "WAREHOUSE_ADMIN", "REQUESTER"]}>
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
                      <Guard allow={["COMPANY_ADMIN", "ADMIN", "WH_MANAGER"]}>
                        <WarehouseManagementPage />
                      </Guard>
                    }
                  />
                  <Route path="/warehouse/:id" element={<WarehouseDetailPage />} />
                  <Route path="/warehouse/:id/dashboard" element={<WarehouseDashboardPage />} />
                  <Route
                    path="select-warehouse"
                    element={
                      <Guard allow={["WH_MANAGER", "WAREHOUSE_ADMIN", "COMPANY_ADMIN", "ADMIN", "PLATFORM_ADMIN"]}>
                        <WarehouseSelectPage />
                      </Guard>
                    }
                  />
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

  // ถ้ายัง login ไม่ได้ redirect ไปหน้า login
  if (!user) {
    return <Navigate to="/login" replace />;
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
  if (['WH_MANAGER', 'WAREHOUSE_ADMIN', 'COMPANY_ADMIN'].includes(user.role)) return <Navigate to="/select-warehouse" replace />;
  if (['BRANCH', 'BRANCH_USER', 'REQUESTER'].includes(user.role)) return <Navigate to="/requisitions/create" replace />;
  if (user.role === 'ADMIN') {
    return <CompanyWarehouseLanding />;
  }
  return <Navigate to="/inventory" replace />;
}

// Smart Dashboard: Redirects to specific warehouse dashboard (with graphs) or falls back to company view
function SmartDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const resolveDashboard = async () => {
      // 1. Check selected warehouse
      const stored = localStorage.getItem('selected_warehouse_id');
      if (stored && stored !== 'all') {
        navigate(`/warehouse/${stored}/dashboard`, { replace: true });
        return;
      }

      // 2. If 'all' selected (or none), try to find ANY warehouse to show graphs
      // because User explicitly requested "graphs" which only exist in WarehouseDashboard
      try {
        const whs = await getWarehouses();
        if (whs.length > 0) {
          // Default to first warehouse
          navigate(`/warehouse/${whs[0].WarehouseId}/dashboard`, { replace: true });
          return;
        }
      } catch (e) {
        console.error("Failed to fetch warehouses for dashboard redirect", e);
      } finally {
        setLoading(false);
      }
    };

    resolveDashboard();
  }, [navigate]);

  if (loading) return <LoadingScreen />;
  return <CompanyDashboardPage />;
}

function CompanyWarehouseLanding() {
  // ไปหน้า inventory แทนหน้าจัดการคลัง
  return <Navigate to="/inventory" replace />;
}

