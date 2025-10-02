import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  Warehouse, 
  ShoppingCart, 
  Truck,
  FileText,
  BarChart3,
  Settings,
  X,
  Cookie,
  Cake,
  ChefHat
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { th } from "@/i18n/th";
import { useAuth } from "@/context/AuthContext";

interface SidebarProps {
  onClose?: () => void;
}

const navigation = [
  {
    name: th.nav.dashboard,
    href: "/",
    icon: LayoutDashboard,
    premiumIcon: ChefHat,
  },
  {
    name: th.nav.suppliers,
    href: "/suppliers",
    icon: Users,
    premiumIcon: Users,
  },
  {
    name: th.nav.products,
    href: "/ingredients",
    icon: Package,
    premiumIcon: Cookie,
  },
  {
    name: th.nav.inventory,
    href: "/inventory",
    icon: Warehouse,
    premiumIcon: Warehouse,
  },
  {
    name: th.nav.purchasing,
    href: "/purchase-orders",
    icon: ShoppingCart,
    premiumIcon: ShoppingCart,
  },
  {
    name: th.nav.receiving,
    href: "/receiving",
    icon: Truck,
    premiumIcon: Truck,
  },
  {
    name: th.nav.requisitions,
    href: "/requisitions",
    icon: FileText,
    premiumIcon: FileText,
  },
  { 
    name: "ผู้ดูแลระบบ", 
    href: "/admin", 
    icon: Settings,
    premiumIcon: Settings,
  },
];

export function Sidebar({ onClose }: SidebarProps) {
  const { user } = useAuth();
  const role = user?.role || "BRANCH";
  const filteredNav = navigation.filter((item) => {
    const adminPaths = ["/admin", "/admin/users", "/admin/branches", "/admin/reports"];
    if (adminPaths.includes(item.href)) return role === "ADMIN";
    if (item.href === "/purchase-orders" || item.href === "/receiving") return role !== "BRANCH";
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-amber-50 to-orange-50 text-secondary-foreground shadow-premium border-r border-amber-200">
      {/* Header with Premium Theme */}
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-amber-200/50 bg-gradient-to-r from-amber-100 to-orange-100">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center shadow-lg">
            <Cake className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-amber-900">{th.dashboard.title}</h1>
            <p className="text-xs text-amber-700 hidden sm:block">{th.dashboard.subtitle}</p>
          </div>
        </div>
        
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="lg:hidden hover:bg-amber-100 text-amber-700"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Navigation with Premium Theme */}
      <nav className="flex-1 p-3 sm:p-4 space-y-2 overflow-y-auto">
        {filteredNav.map((item) => {
          const PremiumIcon = item.premiumIcon || item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-3 sm:px-4 sm:py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  "hover:bg-amber-100 hover:text-amber-900 hover:shadow-sm",
                  isActive
                    ? "bg-gradient-to-r from-amber-200 to-orange-200 text-amber-900 shadow-sm border border-amber-200"
                    : "text-amber-800"
                )
              }
            >
              <PremiumIcon className="h-5 w-5 flex-shrink-0 text-amber-600" />
              <span className="truncate font-medium">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Premium Footer */}
      <div className="p-4 border-t border-amber-200/50 bg-gradient-to-r from-amber-50 to-orange-50">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Cookie className="h-4 w-4 text-orange-500" />
          <span className="text-xs font-medium text-amber-700">Premium Bakery Management</span>
        </div>
        <div className="text-xs text-amber-600 text-center">
          เวอร์ชัน 1.0.0
        </div>
      </div>
    </div>
  );
}