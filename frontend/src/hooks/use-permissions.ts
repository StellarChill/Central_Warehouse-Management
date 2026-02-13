import { useAuth, Role } from "../context/AuthContext";

export const ROLES = {
  ADMIN: "ADMIN" as Role,
  CENTER: "CENTER" as Role,
  BRANCH: "BRANCH" as Role,
};

export function usePermissions() {
  const { user } = useAuth();
  const role = user?.role;

  const isAdmin = ["PLATFORM_ADMIN", "COMPANY_ADMIN", "ADMIN"].includes(role || "");
  const isWarehouseAdmin = ["WH_MANAGER", "WAREHOUSE_ADMIN"].includes(role || "");
  const isRequester = role === "REQUESTER";

  // Backward compatibility alias (if valid)
  const isCenter = isAdmin || isWarehouseAdmin;
  const isBranch = isRequester; // Map REQUESTER to BRANCH concept roughly

  // สิทธิ์ตามฟีเจอร์
  const canApproveRequisition = isAdmin || isWarehouseAdmin;
  const canCreateRequisition = !!user;
  const canManageUsers = isAdmin; // Only Admins can manage users

  // Suppliers & Inventory & Products: Admins + Warehouse Admins can manage
  const canManageSuppliers = isAdmin || isWarehouseAdmin;
  const canManageInventory = isAdmin || isWarehouseAdmin;
  const canEditProducts = isAdmin || isWarehouseAdmin;
  const canManageCategories = isAdmin || isWarehouseAdmin; // New permission for categories

  return {
    user,
    role,
    isAdmin,
    isWarehouseAdmin,
    isRequester,
    // Aliases
    isCenter,
    isBranch,
    // Capabilities
    canApproveRequisition,
    canCreateRequisition,
    canManageUsers,
    canManageSuppliers,
    canManageInventory,
    canEditProducts,
    canManageCategories
  };
}

