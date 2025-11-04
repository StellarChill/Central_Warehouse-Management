// src/pages/LoginPage.tsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Warehouse, Shield, Users, CheckCircle, Eye, EyeOff } from "lucide-react";
import { th } from "../i18n/th";
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

  const features = [
    { icon: Warehouse, title: "จัดการคลังสินค้า", description: "ติดตามสต็อก การรับ-จ่าย และการเคลื่อนไหวสินค้า" },
    { icon: Users, title: "ระบบผู้จำหน่าย", description: "จัดการข้อมูลผู้จำหน่าย สร้างใบสั่งซื้อ และติดตามการส่งมอบ" },
    { icon: Shield, title: "ความปลอดภัยสูง", description: "เข้าสู่ระบบด้วยอีเมล/รหัสผ่าน " },
  ];

  const benefits = [
    "**********",
    "**********",
   "**********",
"**********",
  ];

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
        {/* Left - Branding & copy */}
        <div className="space-y-8">
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                <Warehouse className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{th.dashboard.title}</h1>
                <p className="text-muted-foreground">{th.dashboard.subtitle}</p>
              </div>
            </div>
            <p className="text-lg text-muted-foreground mb-8">
              ระบบจัดการที่ครบครันสำหรับธุรกิจของคุณ
              <br />
              หน้าล็อกอินสาธิต (ยังไม่เชื่อมต่อจริง)
            </p>
          </div>

          <div className="space-y-4">
            {features.map((f) => (
              <div key={f.title} className="flex items-start gap-4 p-4 rounded-lg bg-card/50 backdrop-blur-sm">
                <div className="p-2 rounded-lg bg-primary/10">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden lg:block">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              ไฮไลต์
            </h3>
            <div className="space-y-2">
              {benefits.map((b) => (
                <div key={b} className="flex items-center gap-3 text-sm">
                  <CheckCircle className="h-4 w-4 text-success shrink-0" />
                  <span>{b}</span>
                </div>
              ))}
            </div>
          </div>
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

                <p className="text-center text-sm text-muted-foreground">
                  ยังไม่มีบัญชี? <Link to="/register" className="text-primary hover:underline">สมัครสมาชิก</Link>
                </p>

              

                <div className="space-y-2 text-center">
                 
                  <div className="flex flex-wrap justify-center gap-2">
                    <Badge variant="outline" className="text-xs">{th.roles.ADMIN}</Badge>
                    <Badge variant="outline" className="text-xs">{th.roles.CENTER}</Badge>
                    <Badge variant="outline" className="text-xs">{th.roles.BRANCH}</Badge>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
