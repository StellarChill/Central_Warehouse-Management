import { createContext, useContext, useMemo, useState, ReactNode } from "react";

export type Role = "ADMIN" | "CENTER" | "BRANCH";

type User = { id: string; name: string; role: Role; branch?: string } | null;

type AuthContextType = {
  user: User;
  loginAs: (role: Role) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>({ id: "U-ADMIN", name: "ผู้ดูแล", role: "ADMIN" });

  const value = useMemo<AuthContextType>(() => ({
    user,
    loginAs: (role) => setUser({ id: `U-${role}`, name: role, role }),
    logout: () => setUser(null),
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function RequireRole({ allow, children }: { allow: Role[]; children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return null;
  return allow.includes(user.role) ? <>{children}</> : null;
}


