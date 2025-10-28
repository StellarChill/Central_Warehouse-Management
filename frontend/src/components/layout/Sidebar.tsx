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
  ChefHat,
  FolderKanban
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { th } from "../../i18n/th";
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
    name: "จัดการหมวดหมู่",
    href: "/categories",
    icon: FolderKanban,
    premiumIcon: FolderKanban,
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
    <div className="flex flex-col h-full bg-card text-card-foreground shadow-premium border-r">
      {/* Header with Fresh Theme */}
      <div className="flex items-center justify-between p-4 sm:p-6 border-b">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
          
             <Warehouse className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg">{th.dashboard.title}</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">{th.dashboard.subtitle}</p>
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

      {/* Navigation with Fresh Theme */}
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
                  "hover:bg-accent hover:text-accent-foreground hover:shadow-sm",
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm border border-primary/20"
                    : "text-foreground"
                )
              }
            >
              <PremiumIcon className="h-5 w-5 flex-shrink-0 text-primary" />
              <span className="truncate font-medium">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Cookie className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium">{th.dashboard.title}</span>
        </div>
       
      </div>
    </div>
  );
}