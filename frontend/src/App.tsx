import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import PurchaseOrdersPage from "./pages/PurchaseOrdersPage";
import InventoryPage from "./pages/InventoryPage";
import SuppliersPage from "./pages/SuppliersPage";
import RequisitionsPage from "./pages/RequisitionsPage";
import ReceivingPage from "./pages/ReceivingPage";
import ProductsPage from "./pages/ProductsPage";
import BranchRequisitionCreatePage from "./pages/BranchRequisitionCreatePage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminReportsPage from "./pages/AdminReportsPage";
import AdminHomePage from "./pages/AdminHomePage";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./context/AuthContext";
import { StockProvider } from "./context/StockContext";
import { useAuth } from "./context/AuthContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
      <StockProvider>
        <BrowserRouter>
          <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="/suppliers" element={<SuppliersPage />} />
            <Route path="/ingredients" element={<ProductsPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
            <Route path="/requisitions/create" element={<BranchRequisitionCreatePage />} />
            <Route path="/receiving" element={<ReceivingPage />} />
            <Route path="/requisitions" element={<RequisitionsPage />} />
            <Route path="/admin" element={<Guard allow={["ADMIN"]}><AdminHomePage /></Guard>} />
            <Route path="/admin/users" element={<Guard allow={["ADMIN"]}><AdminUsersPage /></Guard>} />
            {/* Removed audit logs route */}
            <Route path="/admin/reports" element={<Guard allow={["ADMIN"]}><AdminReportsPage /></Guard>} />
            </Route>
            <Route path="/login" element={<LoginPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </StockProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

function Guard({ allow, children }: { allow: ("ADMIN"|"CENTER"|"BRANCH")[]; children: JSX.Element }) {
  const { user } = useAuth();
  if (!user) return null;
  return allow.includes(user.role) ? children : <NotFound />;
}

export default App;
