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
} from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { AuthProvider, useAuth } from "./context/AuthContext";
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
            <Suspense fallback={<div />}>
              <Routes>
                {/* Layout scope */}
                <Route path="/" element={<AppLayout />}>
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

                {/* Top-level routes (outside layout) */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="register" element={<RegisterPage />} />
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

// ---- Guard with redirect for unauthenticated users ----
function Guard({
  allow,
  children,
}: {
  allow: ("ADMIN" | "CENTER" | "BRANCH")[];
  children: JSX.Element;
}) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return allow.includes(user.role) ? children : <NotFound />;
}

export default App;
