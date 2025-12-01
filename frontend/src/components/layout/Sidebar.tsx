import { NavLink, useLocation } from "react-router-dom";
import {
  Warehouse,
  Truck,
  Boxes,
  PackageSearch,
  Factory,
  ClipboardCheck,
  FolderKanban,
  FileBox,
  BriefcaseConveyorBelt,
  ShieldCheck,
  X,
  ScanBarcode,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { th } from "../../i18n/th";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useMemo, useState } from "react";
import { getWarehouses, type Warehouse as WarehouseType } from "@/lib/api";

interface SidebarProps {
  onClose?: () => void;
}

const navigation = [
  {
    name: th.nav.dashboard,
    href: "/",
    icon: Warehouse,
    premiumIcon: ClipboardList,
  },
  {
    name: th.nav.receiving,
    href: "/receiving",
    icon: Truck,
    premiumIcon: Truck,
  },
  {
    name: th.nav.inventory,
    href: "/inventory",
    icon: Boxes,
    premiumIcon: Boxes,
  },
  {
    name: th.nav.products,
    href: "/ingredients",
    icon: PackageSearch,
    premiumIcon: PackageSearch,
  },
  {
    name: th.nav.suppliers,
    href: "/suppliers",
    icon: Factory,
    premiumIcon: Factory,
  },
  {
    name: th.nav.purchasing,
    href: "/purchase-orders",
    icon: ClipboardCheck,
    premiumIcon: ClipboardCheck,
  },
  {
    name: "จัดการหมวดหมู่",
    href: "/categories",
    icon: FolderKanban,
    premiumIcon: FolderKanban,
  },
  {
    name: th.nav.requisitions,
    href: "/requisitions",
    icon: FileBox,
    premiumIcon: FileBox,
  },
  {
    name: "จัดการคลังสินค้า",
    href: "/warehouse-management",
    icon: BriefcaseConveyorBelt,
    premiumIcon: BriefcaseConveyorBelt,
  },
  { 
    name: "ผู้ดูแลระบบ", 
    href: "/admin", 
    icon: ShieldCheck,
    premiumIcon: ShieldCheck,
  },
];

export function Sidebar({ onClose }: SidebarProps) {
  const { user } = useAuth();
  const role = user?.role || "BRANCH";
  const location = useLocation();
  const allowWarehouseNav = ["COMPANY_ADMIN", "ADMIN", "WAREHOUSE_ADMIN"].includes(role);
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!allowWarehouseNav) {
      setWarehouses([]);
      return;
    }
    setLoadingWarehouses(true);
    getWarehouses()
      .then((list) => {
        if (!cancelled) setWarehouses(list || []);
      })
      .catch(() => {
        if (!cancelled) setWarehouses([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingWarehouses(false);
      });
    return () => { cancelled = true; };
  }, [role]);

  const warehouseNavItems = useMemo(() => {
    return warehouses.map((w, idx) => ({
      ...w,
      label: w.WarehouseName || `คลัง ${idx + 1}`,
      href: `/warehouse/${w.WarehouseId}/dashboard`,
      isPrimary: idx === 0,
    }));
  }, [warehouses]);

  const activeWarehouseId = useMemo(() => {
    const match = location.pathname.match(/^\/warehouse\/(\d+)/);
    return match ? Number(match[1]) : null;
  }, [location.pathname]);

  const filteredNav = navigation.filter((item) => {
    const adminPaths = ["/admin", "/admin/users", "/admin/branches", "/admin/reports"];
    if (adminPaths.includes(item.href)) return role === "ADMIN";
      if (item.href === "/warehouse-management") return role === "COMPANY_ADMIN" || role === "ADMIN" || role === "WAREHOUSE_ADMIN";
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

        {allowWarehouseNav && (
          <div className="pt-4 mt-4 border-t">
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              คลังของบริษัท
            </p>
            {loadingWarehouses && (
              <div className="text-xs text-muted-foreground">กำลังโหลดคลัง...</div>
            )}
            {!loadingWarehouses && warehouseNavItems.length === 0 && (
              <div className="text-xs text-muted-foreground">ยังไม่มีคลังที่ถูกสร้าง</div>
            )}
            {!loadingWarehouses && warehouseNavItems.map((item) => {
              const isActive = activeWarehouseId === item.WarehouseId;
              return (
                <NavLink
                  key={item.WarehouseId}
                  to={item.href}
                  onClick={onClose}
                  className={({ isActive: navActive }) =>
                    cn(
                      "flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                      navActive || isActive
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground"
                    )
                  }
                >
                  <div className="flex items-center gap-3">
                    <Warehouse className="h-4 w-4 text-primary" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{item.label}</span>
                      {item.WarehouseCode && (
                        <span className="text-xs text-muted-foreground">รหัส {item.WarehouseCode}</span>
                      )}
                    </div>
                  </div>
                  {item.isPrimary && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-semibold">
                      คลังหลัก
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t">
        <div className="flex items-center justify-center gap-2 mb-2">
          <ScanBarcode className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium">{th.dashboard.title}</span>
        </div>
       
      </div>
    </div>
  );
}