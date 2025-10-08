import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Warehouse, Smartphone, Shield, Users, CheckCircle } from "lucide-react";
import { th } from "@/i18n/th";

export default function LoginPage() {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleLineLogin = async () => {
    setIsConnecting(true);
    // Simulate LINE LIFF initialization and login
    setTimeout(() => {
      setIsConnecting(false);
      // In real app, this would redirect to main app after successful auth
      window.location.href = "/";
    }, 2000);
  };

  const features = [
    {
      icon: Warehouse,
      title: "จัดการคลังสินค้า",
      description: "ติดตามสต็อก การรับ-จ่าย และการเคลื่อนไหวสินค้า",
    },
    {
      icon: Users,
      title: "ระบบผู้จำหน่าย",
      description: "จัดการข้อมูลผู้จำหน่าย สร้างใบสั่งซื้อ และติดตามการส่งมอบ",
    },
    {
      icon: Shield,
      title: "ความปลอดภัยสูง",
      description: "เข้าสู่ระบบผ่าน LINE Login ด้วยความปลอดภัยระดับสูง",
    },
  ];

  const benefits = [
    "เข้าใช้งานง่าย ผ่าน LINE ที่คุณใช้อยู่แล้ว",
    "ไม่ต้องจำรหัสผ่านเพิ่มเติม",
    "รับการแจ้งเตือนสำคัญทาง LINE",
    "ปลอดภัยด้วยมาตรฐาน OAuth 2.0",
  ];

  return (
    <div className="min-h-screen gradient-surface flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding and Features */}
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
              เข้าสู่ระบบง่ายๆ ด้วย LINE Login
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-4 p-4 rounded-lg bg-card/50 backdrop-blur-sm">
                <div className="p-2 rounded-lg bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Benefits */}
          <div className="hidden lg:block">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              ข้อดีของการใช้ LINE Login
            </h3>
            <div className="space-y-2">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3 text-sm">
                  <CheckCircle className="h-4 w-4 text-success shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right side - Login Card */}
        <div className="flex justify-center">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">เข้าสู่ระบบ</CardTitle>
              <p className="text-muted-foreground">
                ใช้ LINE Account ของคุณเพื่อเข้าสู่ระบบ
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* LINE Login Button */}
              <Button
                onClick={handleLineLogin}
                disabled={isConnecting}
                className="w-full h-12 text-lg"
              >
                {isConnecting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    กำลังเชื่อมต่อ...
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-6 w-6" />
                    เข้าสู่ระบบด้วย LINE
                  </div>
                )}
              </Button>

              {/* Info */}
              <div className="text-center space-y-4">
                <div className="p-4 bg-info/10 rounded-lg border border-info/20">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-info" />
                    <span className="text-sm font-medium text-info">ปลอดภัยและเชื่อถือได้</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    เราไม่เก็บข้อมูล LINE ของคุณ ใช้เพียงเพื่อการยืนยันตัวตนเท่านั้น
                  </p>
                </div>

                {/* Role Badges */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">บทบาทในระบบ:</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {th.roles.ADMIN}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {th.roles.CENTER}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {th.roles.BRANCH}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Demo Notice */}
              <div className="text-center p-3 bg-warning/10 rounded-lg border border-warning/20">
                <p className="text-xs text-warning-foreground">
                  <strong>หมายเหตุ:</strong> นี่เป็นระบบสาธิต
                  <br />
                  ในการใช้งานจริงจะเชื่อมต่อกับ LINE Official Account
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}