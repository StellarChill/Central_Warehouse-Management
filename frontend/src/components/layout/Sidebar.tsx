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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SidebarProps {
  onClose?: () => void;
}

const navigation = [
  {
    name: th.nav.dashboard,
    href: "/dashboard",
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
    name: "การเบิกจ่าย (Issuing)",
    href: "/inventory/issuing",
    icon: PackageSearch,
    premiumIcon: PackageSearch,
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
  const allowWarehouseNav = ["COMPANY_ADMIN", "ADMIN", "WAREHOUSE_ADMIN", "WH_MANAGER"].includes(role);
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

  const filteredNav = useMemo(() => {
    return navigation.map(item => ({ ...item })).filter((item) => {
      // Admin paths: accessible by ADMIN and COMPANY_ADMIN (for company dashboard)
      const adminPaths = ["/admin", "/admin/users", "/admin/branches", "/admin/reports"];
      if (adminPaths.includes(item.href)) {
        if (item.href === "/admin") return ["ADMIN", "COMPANY_ADMIN"].includes(role);
        return ["ADMIN", "COMPANY_ADMIN"].includes(role);
      }

      // Warehouse Management Menu Logic
      if (item.href === "/warehouse-management") {
        // Show for: COMPANY_ADMIN, ADMIN (Manage), and WH_MANAGER/WAREHOUSE_ADMIN (Select Warehouse)
        if (!["COMPANY_ADMIN", "ADMIN", "WAREHOUSE_ADMIN", "WH_MANAGER"].includes(role)) return false;

        // If role is WAREHOUSE_ADMIN -> change href to /select-warehouse (only select, no manage)
        if (role === "WAREHOUSE_ADMIN") {
          item.href = "/select-warehouse";
        }
        return true;
      }

      // REQUESTER visibility
      if (role === "REQUESTER") {
        const requesterPaths = ["/", "/ingredients", "/requisitions", "/requisitions/create"];
        return requesterPaths.includes(item.href);
      }

      // WH_MANAGER / WAREHOUSE_ADMIN visibility
      if (["WH_MANAGER", "WAREHOUSE_ADMIN"].includes(role)) {
        // Hide unrelated menus if necessary (currently most are relevant)
        // They should see: Dashboard, Receiving, Inventory, Products, Suppliers, Issuing, Purchasing, Categories, Requisitions, Warehouse Management(Select)
        const allowedPaths = [
          "/",
          "/receiving",
          "/inventory",
          "/ingredients",
          // "/suppliers", // Hidden (Purchasing Dept)
          "/inventory/issuing",
          "/purchase-orders",
          // "/categories", // Hidden (Admin)
          // "/requisitions",
          "/warehouse-management",
          "/select-warehouse"
        ];
        // Check if current item is allowed
        // Special case: /warehouse-management becomes /select-warehouse for WAREHOUSE_ADMIN
        let currentHref = item.href;
        if (role === "WAREHOUSE_ADMIN" && item.href === "/warehouse-management") {
          currentHref = "/select-warehouse";
        }
        return allowedPaths.includes(currentHref) || allowedPaths.includes(item.href);
      }

      if (item.href === "/purchase-orders" || item.href === "/receiving") return role !== "BRANCH";
      return true;
    });
  }, [role]);

  return (
    <div className="flex flex-col h-full bg-card text-card-foreground shadow-premium border-r">
      {/* Header with Fresh Theme */}
      <div className="flex flex-col border-b bg-muted/10 p-4 gap-4">
        <div className="flex items-center justify-between">
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

        {/* Global Warehouse Selector */}
        {allowWarehouseNav && warehouses.length > 0 && (
          <div className="w-full">
            <label className="text-xs text-muted-foreground font-medium mb-1.5 block px-1">
              Current Warehouse
            </label>
            <Select
              value={localStorage.getItem('selected_warehouse_id') || "all"}
              onValueChange={(val) => {
                if (val === "all") {
                  localStorage.removeItem('selected_warehouse_id');
                } else {
                  localStorage.setItem('selected_warehouse_id', val);
                }
                // Force reload to apply headers and context
                window.location.reload();
              }}
            >
              <SelectTrigger className="w-full bg-background border-muted-foreground/20 h-9 text-sm">
                <SelectValue placeholder="Select Warehouse" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Warehouses (Global)</SelectItem>
                {warehouses.map(w => (
                  <SelectItem key={w.WarehouseId} value={String(w.WarehouseId)}>
                    {w.WarehouseName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
              // Prevent '/inventory' from matching '/inventory/issuing'
              end={item.href === "/inventory" || item.href === "/"}
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

        {/* ซ่อนส่วนแสดงภาพรวมคลัง (Redundant with Dropdown) */}
        {/* {allowWarehouseNav && (
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
               // ... (hidden items)
               return null;
            })}
          </div>
        )} */}
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