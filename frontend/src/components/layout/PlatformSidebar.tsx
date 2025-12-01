import { NavLink } from "react-router-dom";
import {
  Warehouse,
  Factory,
  UserRound,
  X,
  ScanBarcode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PlatformSidebarProps {
  onClose?: () => void;
}

const navigation = [
  {
    name: "Home",
    href: "/platform",
    icon: Warehouse,
  },
  {
    name: "Manage Companies",
    href: "/platform/companies",
    icon: Factory,
  },
  {
    name: "Manage Users",
    href: "/platform/users",
    icon: UserRound,
  },
];

export function PlatformSidebar({ onClose }: PlatformSidebarProps) {
  return (
    <div className="flex flex-col h-full bg-card text-card-foreground shadow-premium border-r">
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-6 border-b">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center shadow-lg">
            <Warehouse className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Platform Admin</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">จัดการระบบทั้งหมด</p>
          </div>
        </div>
        
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="lg:hidden hover:bg-accent"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 sm:p-4 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-3 sm:px-4 sm:py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  "hover:bg-accent hover:text-accent-foreground hover:shadow-sm",
                  isActive
                    ? "bg-blue-500/10 text-blue-600 shadow-sm border border-blue-500/20"
                    : "text-foreground"
                )
              }
            >
              <Icon className="h-5 w-5 flex-shrink-0 text-blue-600" />
              <span className="truncate font-medium">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t">
        <div className="flex items-center justify-center gap-2 mb-2">
          <ScanBarcode className="h-4 w-4 text-blue-600" />
          <span className="text-xs font-medium">Super Admin Panel</span>
        </div>
      </div>
    </div>
  );
}
