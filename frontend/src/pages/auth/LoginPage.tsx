// src/pages/LoginPage.tsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // URL จะเป็น / อยู่แล้ว ไม่ต้องแก้ไข

  // ถ้า login แล้ว redirect ไปหน้าแรก
  useEffect(() => {
    if (user) {
      const from = (location.state as any)?.from?.pathname || "/";
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  // ลดเนื้อหาให้เรียบง่าย ไม่ใส่สื่อการตลาด/แบรนดิ้งเก่า

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username || !password) {
      setError("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(username, password);
      // ถ้า login สำเร็จ useEffect จะ redirect ให้
    } catch (err: any) {
      setError(err?.message || "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen gradient-surface flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left - Minimal brand area */}
        <div className="space-y-6 text-center lg:text-left">
          <h1 className="text-3xl font-bold">เข้าสู่ระบบ WMS Cloud</h1>
          <p className="text-muted-foreground">กรอกชื่อผู้ใช้และรหัสผ่านเพื่อใช้งานระบบ</p>
        </div>

        {/* Right - Card */}
        <div className="flex justify-center">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">เข้าสู่ระบบ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username */}
                <div className="space-y-1">
                  <Label htmlFor="username">ชื่อผู้ใช้</Label>
                  <Input
                    id="username"
                    placeholder="กรอกชื่อผู้ใช้"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <Label htmlFor="password">รหัสผ่าน</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPwd ? "text" : "password"}
                      placeholder="อย่างน้อย 6 ตัวอักษร"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      className="pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground"
                      aria-label={showPwd ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                      aria-pressed={showPwd}
                    >
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full h-12 text-lg">
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      กำลังเข้าสู่ระบบ...
                    </div>
                  ) : (
                    "เข้าสู่ระบบ"
                  )}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  ยังไม่มีบัญชีองค์กร?{' '}
                  <Link to="/register-company" className="text-primary hover:underline">สมัครสำหรับองค์กร</Link>
                </div>

              

                {/* Removed old role badges and marketing */}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
