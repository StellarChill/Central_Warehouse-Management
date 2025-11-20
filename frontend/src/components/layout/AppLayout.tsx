import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children?: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hideSidebar, setHideSidebar] = useState(false);

  const { user } = useAuth();
  const location = useLocation();
  const routeHidesSidebar =
    location.pathname === "/warehouse-overview" ||
    location.pathname === "/warehouse-management" ||
    location.pathname.startsWith("/platform");

  // Re-evaluate liff-only mode whenever auth user changes (so login via LIFF updates layout immediately)
  useEffect(() => {
    try {
      const liffOnly = localStorage.getItem('liff_only');
      setHideSidebar(!!liffOnly);
      if (liffOnly) setSidebarOpen(false);
    } catch (e) {
      setHideSidebar(false);
    }
  }, [user]);

  return (
    <div className="flex h-screen bg-gradient-surface font-prompt">
      {/* Sidebar */}
      {!routeHidesSidebar && !hideSidebar && (
        <div className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Sidebar overlay */}
      {!hideSidebar && !routeHidesSidebar && sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} hideMenu={hideSidebar || routeHidesSidebar} />
        
        <main className="flex-1 overflow-y-auto bg-background/50 backdrop-blur-xl">
          <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
}