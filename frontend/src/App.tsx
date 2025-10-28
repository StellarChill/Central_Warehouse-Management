// src/App.tsx
import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { AuthProvider, useAuth, Role } from "./context/AuthContext";
import { StockProvider } from "./context/StockContext";

// ---- Code-split pages (improves first-load perf) ----
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const PurchaseOrdersPage = lazy(() => import("./pages/PurchaseOrdersPage"));
const InventoryPage = lazy(() => import("./pages/InventoryPage"));
const SuppliersPage = lazy(() => import("./pages/SuppliersPage"));
const RequisitionsPage = lazy(() => import("./pages/RequisitionsPage"));
const ReceivingPage = lazy(() => import("./pages/ReceivingPage"));
const ProductsPage = lazy(() => import("./pages/ProductsPage"));
const BranchRequisitionCreatePage = lazy(
  () => import("./pages/BranchRequisitionCreatePage")
);
const AdminUsersPage = lazy(() => import("./pages/AdminUsersPage"));
const AdminReportsPage = lazy(() => import("./pages/AdminReportsPage"));
const AdminHomePage = lazy(() => import("./pages/AdminHomePage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

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
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Protected routes with layout */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  {/* Child routes should be relative to render inside AppLayout's <Outlet /> */}
                  <Route index element={<DashboardPage />} />
                  <Route path="suppliers" element={<SuppliersPage />} />
                  <Route path="ingredients" element={<ProductsPage />} />
                  <Route path="inventory" element={<InventoryPage />} />
                  <Route path="purchase-orders" element={<PurchaseOrdersPage />} />
                  <Route
                    path="requisitions/create"
                    element={<BranchRequisitionCreatePage />}
                  />
                  <Route path="receiving" element={<ReceivingPage />} />
                  <Route path="requisitions" element={<RequisitionsPage />} />
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
                  {/* Removed audit logs route */}
                  <Route
                    path="admin/reports"
                    element={
                      <Guard allow={["ADMIN"]}>
                        <AdminReportsPage />
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

// ---- ProtectedRoute: ป้องกันการเข้าถึงถ้ายัง login ไม่ได้ ----
function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // ถ้ากำลังโหลดข้อมูล user จาก localStorage ให้แสดง loading
  if (isLoading) {
    return <LoadingScreen />;
  }

  // ถ้ายัง login ไม่ได้ redirect ไปหน้า login พร้อมเก็บ location ที่พยายามเข้า
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
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
    return <Navigate to="/login" replace />;
  }
  return allow.includes(user.role) ? children : <NotFound />;
}

export default App;
