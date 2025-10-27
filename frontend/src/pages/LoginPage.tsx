// src/pages/LoginPage.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Warehouse, Shield, Users, CheckCircle, Eye, EyeOff, Mail } from "lucide-react";
import { th } from "../i18n/th";

export default function LoginPage() {
  // เฉพาะ state สำหรับ UI เท่านั้น (ไม่มีการเรียก API/redirect)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

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

  const handleFakeSubmit = (e: React.FormEvent) => {
    e.preventDefault();           // กันรีเฟรช
    setIsClicking(true);          // แสดงสปินเนอร์ให้เห็นเอฟเฟกต์
    setTimeout(() => setIsClicking(false), 1200); // กลับสภาพเดิม
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
              <form onSubmit={handleFakeSubmit} className="space-y-4">
                {/* Email */}
                <div className="space-y-1">
                  <label htmlFor="email" className="text-sm font-medium">อีเมล</label>
                  <div className="relative">
                    <Input
                      id="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pr-9"
                    />
                    <Mail className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label htmlFor="password" className="text-sm font-medium">รหัสผ่าน</label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPwd ? "text" : "password"}
                      placeholder="อย่างน้อย 6 ตัวอักษร"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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

                <Button type="submit" disabled={isClicking} className="w-full h-12 text-lg">
                  {isClicking ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      กำลังเช็คข้อมูล...
                    </div>
                  ) : (
                    "เข้าสู่ระบบ "
                  )}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  ยังไม่มีบัญชี? <a href="/register" className="text-primary hover:underline">สมัครสมาชิก</a>
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
