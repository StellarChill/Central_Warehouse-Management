import { createContext, useContext, useMemo, useState, ReactNode, useEffect } from "react";

export type Role = "ADMIN" | "CENTER" | "BRANCH";

// User type ที่ได้จาก backend
type User = {
  UserId: number;
  UserName: string;
  RoleId: number;
  BranchId: number;
  Email?: string;
  role: Role; // map จาก RoleId
} | null;

type AuthContextType = {
  user: User;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  // Accept either a LineId (legacy) or an id_token from LIFF (recommended)
  loginWithLine: (tokenOrLineId: string, isIdToken?: boolean) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
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

// ถ้าไม่ตั้ง VITE_API_URL จะ fallback ไปใช้ "/api"
// ตั้งค่า API base URL - ถ้ามี VITE_API_URL ใช้ตามนั้น, ถ้าไม่มีใช้ /api
const getApiBase = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    // ลบ trailing slash และตรวจสอบว่า URL มี /api หรือไม่
    const cleanUrl = envUrl.replace(/\/+$/, "");
    // ถ้า URL ไม่มี /api ตอนท้าย ให้เพิ่ม /api
    if (!cleanUrl.endsWith('/api')) {
      return `${cleanUrl}/api`;
    }
    return cleanUrl;
  }
  return "/api";
};

const API_BASE = getApiBase();

// แปลง RoleId เป็น Role string
function getRoleFromRoleId(roleId: number): Role {
  if (roleId === 1) return "ADMIN";
  if (roleId === 2) return "CENTER";
  if (roleId === 3) return "BRANCH";
  return "BRANCH"; // default
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
          role: getRoleFromRoleId(userData.RoleId)
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
      throw new Error(data.error || `Login failed (HTTP ${res.status})`);
    }

    const data = await res.json();
    const userData = {
      ...data.user,
      role: getRoleFromRoleId(data.user.RoleId)
    };

    // เก็บ token และ user ใน localStorage
    localStorage.setItem("auth_token", data.token);
    localStorage.setItem("auth_user", JSON.stringify(data.user));
    
    setToken(data.token);
    setUser(userData);
  };

  // Login using LINE LineId. Backend should accept LineId and return token/user.
  const loginWithLine = async (tokenOrLineId: string, isIdToken = false) => {
    const body = isIdToken ? { id_token: tokenOrLineId } : { LineId: tokenOrLineId };
    const res = await fetch(`${API_BASE}/login/line`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `LINE login failed (HTTP ${res.status})`);
    }

    const data = await res.json();
    const userData = {
      ...data.user,
      role: getRoleFromRoleId(data.user.RoleId),
    };

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
      // Try to parse JSON error body, otherwise read plain text to show helpful message
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

      // Prefer backend `message` then `error`, then plain text
      let msg = data?.message || data?.error || textBody || `Registration failed (HTTP ${res.status})`;
      if (res.status === 409) msg = data?.message || data?.error || "มีชื่อผู้ใช้นี้ในระบบแล้ว";
      if (res.status === 400) msg = data?.message || data?.error || textBody || "ข้อมูลไม่ครบถ้วนหรือไม่ถูกต้อง";
      throw new Error(msg);
    }

    // สมัครสำเร็จแล้ว ไม่ต้อง login ทันที ให้ user ไป login เอง
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    try { localStorage.removeItem('liff_only'); } catch (e) { /* ignore */ }
    setToken(null);
    setUser(null);
  };

  const value = useMemo<AuthContextType>(() => ({
    user,
    token,
    login,
    loginWithLine,
    register,
    logout,
    isLoading,
  }), [user, token, isLoading]);

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


