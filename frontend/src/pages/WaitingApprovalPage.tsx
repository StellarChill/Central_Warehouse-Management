import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function WaitingApprovalPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen gradient-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">ส่งคำขอสมัครเรียบร้อย</CardTitle>
            <p className="text-muted-foreground">บัญชีของคุณถูกส่งไปยังผู้ดูแลระบบเพื่อรอการอนุมัติ</p>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p>ผู้ดูแลระบบจะตรวจสอบและอนุมัติผู้ใช้ใหม่ หากอนุมัติแล้ว คุณจะสามารถใช้งานระบบได้</p>
            <div className="flex justify-center">
              <Button onClick={() => navigate("/", { replace: true })}>กลับไปหน้าแรก</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
