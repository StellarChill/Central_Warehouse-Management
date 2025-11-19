import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, UserPlus, ShieldCheck, Clock } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

export default function RegisterLandingPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen gradient-surface flex items-center justify-center p-6">
      <div className="w-full max-w-5xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">สมัครใช้งานระบบ</h1>
          <p className="text-muted-foreground">เลือกรูปแบบการสมัครให้เหมาะกับคุณ ระบบจะส่งคำขอเพื่อรอการอนุมัติจากผู้ดูแล Platform</p>
          <div className="flex justify-center gap-2 mt-2">
            <Badge variant="secondary" className="text-xs flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> ต้องรออนุมัติ</Badge>
            <Badge variant="outline" className="text-xs flex items-center gap-1"><Clock className="h-3 w-3" /> อนุมัติภายหลัง</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-md transition">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-blue-600" /> สมัครพร้อมบริษัท (แนะนำสำหรับบริษัทใหม่)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <ul className="list-disc pl-5 space-y-1">
                <li>สร้างข้อมูลบริษัท + ผู้ดูแลบริษัท (Admin) ในขั้นตอนเดียว</li>
                <li>เหมาะสำหรับลูกค้าองค์กรที่ยังไม่มีบัญชีในระบบ</li>
                <li>เมื่อส่งคำขอแล้ว รอผู้ดูแล Platform อนุมัติ</li>
              </ul>
              <Button className="mt-2" onClick={() => navigate('/register-company')}>เริ่มสมัครพร้อมบริษัท</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserPlus className="h-5 w-5 text-green-600" /> สมัครผู้ใช้งาน (เข้าร่วมบริษัทที่มีอยู่)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <ul className="list-disc pl-5 space-y-1">
                <li>เลือกบริษัทที่มีอยู่ แล้วกำหนดบทบาทและสาขาที่เกี่ยวข้อง</li>
                <li>ส่งคำขอเพื่อให้ผู้ดูแล Platform อนุมัติ ก่อนเข้าใช้งาน</li>
              </ul>
              <Button className="mt-2" variant="secondary" onClick={() => navigate('/register/user')}>เริ่มสมัครผู้ใช้งาน</Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          มีบัญชีอยู่แล้ว? <Link to="/login" className="text-primary hover:underline">เข้าสู่ระบบ</Link>
        </div>
      </div>
    </div>
  );
}
