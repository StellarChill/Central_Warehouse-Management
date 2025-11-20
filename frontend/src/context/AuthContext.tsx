// frontend/src/context/AuthContext.tsx
import {
  createContext,
  useContext,
  useMemo,
  useState,
  ReactNode,
  useEffect,
} from "react";

export type Role = "PLATFORM_ADMIN" | "PLATFORM_STAFF" | "COMPANY_ADMIN" | "WAREHOUSE_ADMIN" | "BRANCH_MANAGER" | "BRANCH_USER" | "VIEWER" | "ADMIN" | "CENTER" | "BRANCH";

// User type ที่ได้จาก backend
type User = {
  UserId: number;
  UserName: string;
  RoleId: number;
  BranchId: number;
  CompanyId?: number;
  CompanyName?: string | null;
  CompanyCode?: string | null;
  Email?: string;
  UserStatus?: string; // 👈 เพิ่มสถานะ user
  role: Role; // from roleCode or RoleId
  roleCode?: string;
} | null;

type AuthContextType = {
  user: User;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  // Accept either a LineId (legacy) or an id_token from LIFF (recommended)
  loginWithLine: (tokenOrLineId: string, isIdToken?: boolean) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  registerCompany: (payload: {
    CompanyName: string;
    CompanyAddress?: string;
    TaxId?: string;
    CompanyEmail?: string;
    CompanyTelNumber?: string;
    AdminUserName: string;
    AdminUserPassword: string;
    AdminEmail?: string;
    AdminTelNumber?: string;
  }) => Promise<any>;
  logout: () => void;
  isLoading: boolean;
};

type RegisterData = {
  UserName: string;
  UserPassword: string;
  Company?: string;
  BranchName?: string;
  RoleId: number;
  BranchId: number;
  Email: string;
  TelNumber: string;
  LineId?: string;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ตั้งค่า API base URL
const getApiBase = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    const cleanUrl = envUrl.replace(/\/+$/, "");
    if (!cleanUrl.endsWith("/api")) {
      return `${cleanUrl}/api`;
    }
    return cleanUrl;
  }
  return "/api";
};

const API_BASE = getApiBase();

// แปลง RoleId เป็น Role string
function roleFromRoleId(roleId: number): Role {
  if (roleId === 1) return "ADMIN";
  if (roleId === 2) return "CENTER";
  if (roleId === 3) return "BRANCH";
  return "BRANCH"; // default
}

function roleFromPayload(u: any): Role {
  const code = (u?.roleCode || u?.RoleCode || '').toString().toUpperCase();
  if (code === 'PLATFORM_ADMIN') return 'PLATFORM_ADMIN';
  if (code === 'PLATFORM_STAFF') return 'PLATFORM_STAFF';
  if (code === 'COMPANY_ADMIN') return 'COMPANY_ADMIN';
  if (code === 'WAREHOUSE_ADMIN') return 'WAREHOUSE_ADMIN';
  if (code === 'BRANCH_MANAGER') return 'BRANCH_MANAGER';
  if (code === 'BRANCH_USER') return 'BRANCH_USER';
  if (code === 'VIEWER') return 'VIEWER';
  if (code === 'ADMIN') return 'ADMIN';
  if (code === 'CENTER') return 'CENTER';
  if (code === 'BRANCH') return 'BRANCH';
  // fallback by RoleId
  return roleFromRoleId(Number(u?.RoleId));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // เมื่อ mount ครั้งแรก ตรวจสอบว่ามี token ใน localStorage หรือไม่
  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("auth_user");

    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setToken(storedToken);
        setUser({
          ...userData,
          role: roleFromPayload(userData),
        });
      } catch (err) {
        console.error("Failed to parse stored user:", err);
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ UserName: username, UserPassword: password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const err: any = new Error(data.error || `Login failed (HTTP ${res.status})`);
      err.status = res.status;
      throw err;
    }

    const data = await res.json();
    const userData = {
      ...data.user,
      role: roleFromPayload(data.user),
    };

    localStorage.setItem("auth_token", data.token);
    localStorage.setItem("auth_user", JSON.stringify(data.user));

    setToken(data.token);
    setUser(userData);
  };

  // Login using LINE LineId หรือ id_token
  const loginWithLine = async (tokenOrLineId: string, isIdToken = false) => {
    const body = isIdToken
      ? { id_token: tokenOrLineId }
      : { LineId: tokenOrLineId };

    const res = await fetch(`${API_BASE}/login/line`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      let data: any = {};
      try {
        data = await res.json();
      } catch {
        // ignore
      }
      throw new Error(data.error || `LINE login failed (HTTP ${res.status})`);
    }

    const data = await res.json();
    const userData = {
      ...data.user,
      role: roleFromPayload(data.user),
    };

    localStorage.setItem("liff_only", "true");
    localStorage.setItem("auth_token", data.token);
    localStorage.setItem("auth_user", JSON.stringify(data.user));

    setToken(data.token);
    setUser(userData);
  };

  const register = async (registerData: RegisterData) => {
    const res = await fetch(`${API_BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(registerData),
    });

    if (!res.ok) {
      let data: any = {};
      let textBody = "";
      try {
        data = await res.json();
      } catch (e) {
        try {
          textBody = await res.text();
        } catch (e2) {
          textBody = "";
        }
      }

      let msg =
        data?.message ||
        data?.error ||
        textBody ||
        `Registration failed (HTTP ${res.status})`;
      if (res.status === 409)
        msg = data?.message || data?.error || "มีชื่อผู้ใช้นี้ในระบบแล้ว";
      if (res.status === 400)
        msg =
          data?.message ||
          data?.error ||
          textBody ||
          "ข้อมูลไม่ครบถ้วนหรือไม่ถูกต้อง";
      throw new Error(msg);
    }

    // สมัครเสร็จ แต่ยังไม่ login ที่นี่
  };

  // Company self-service registration
  const registerCompany = async (payload: {
    CompanyName: string;
    CompanyAddress?: string;
    TaxId?: string;
    CompanyEmail?: string;
    CompanyTelNumber?: string;
    AdminUserName: string;
    AdminUserPassword: string;
    AdminEmail?: string;
    AdminTelNumber?: string;
  }) => {
    // Call the public nested-body endpoint
    const res = await fetch(`${API_BASE}/public/company-register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company: {
          CompanyName: payload.CompanyName,
          CompanyAddress: payload.CompanyAddress,
          TaxId: payload.TaxId,
          CompanyEmail: payload.CompanyEmail,
          CompanyTelNumber: payload.CompanyTelNumber,
        },
        adminUser: {
          UserName: payload.AdminUserName,
          UserPassword: payload.AdminUserPassword,
          Email: payload.AdminEmail,
          TelNumber: payload.AdminTelNumber,
        },
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({} as any));
      throw new Error(data?.error || `Register company failed (HTTP ${res.status})`);
    }
    const data = await res.json();
    // Do NOT auto-login when company is pending approval
    return data;
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    try {
      localStorage.removeItem("liff_only");
    } catch (e) {
      // ignore
    }
    setToken(null);
    setUser(null);
  };

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      login,
      loginWithLine,
      register,
      registerCompany,
      logout,
      isLoading,
    }),
    [user, token, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function RequireRole({
  allow,
  children,
}: {
  allow: Role[];
  children: ReactNode;
}) {
  const { user } = useAuth();
  if (!user) return null;
  return allow.includes(user.role) ? <>{children}</> : null;
}
