import { useState } from "react";
import { PlatformSidebar } from "./PlatformSidebar";
import { Header } from "./Header";
import { cn } from "@/lib/utils";

interface PlatformLayoutProps {
  children: React.ReactNode;
}

export function PlatformLayout({ children }: PlatformLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gradient-to-b from-slate-50 to-white font-prompt">
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <PlatformSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} hideMenu={false} />
        
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
