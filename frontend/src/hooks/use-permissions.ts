import { useAuth, Role } from "../context/AuthContext";

export const ROLES = {
  ADMIN: "ADMIN" as Role,
  CENTER: "CENTER" as Role,
  BRANCH: "BRANCH" as Role,
};

export function usePermissions() {
  const { user } = useAuth();

  const isAdmin = user?.role === ROLES.ADMIN;
  const isCenter = user?.role === ROLES.CENTER;
  const isBranch = user?.role === ROLES.BRANCH;

  // สิทธิ์ตามฟีเจอร์
  const canApproveRequisition = isAdmin || isCenter;
  const canCreateRequisition = !!user;
  const canManageUsers = isAdmin;
  const canManageSuppliers = isAdmin || isCenter;
  const canManageInventory = isAdmin || isCenter;
  const canEditProducts = isAdmin || isCenter;

  return {
    user,
    isAdmin,
    isCenter,
    isBranch,
    canApproveRequisition,
    canCreateRequisition,
    canManageUsers,
    canManageSuppliers,
    canManageInventory,
    canEditProducts,
  };
}

