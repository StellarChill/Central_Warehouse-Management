import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Clock, CheckCircle, AlertCircle } from "lucide-react";

type UserStatus = {
  UserId: string;
  UserName: string;
  Email: string;
  LineId: string;
  RoleId: number;
  BranchId?: number | null;
  BranchName?: string | null;
  Company?: string | null;
  status?: string | null;
  TelNumber?: string | null;
};

export default function UserStatusPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/", { replace: true });
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        // เรียก API เพื่อดึงสถานะของผู้ใช้ปัจจุบัน
        const res = await fetch(`/api/users/me`, { credentials: "include" });
        if (!res.ok) throw new Error(`Load failed (HTTP ${res.status})`);
        const data: UserStatus = await res.json();
        setUserStatus(data);
      } catch (err: any) {
        console.error("Failed to load user status", err);
        setError(err?.message || "ไม่สามารถโหลดข้อมูลได้");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user, navigate]);

  const getStatusBadge = (status?: string | null) => {
    if (status === "ACTIVE") {
      return (
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <Badge className="bg-green-100 text-green-800">อনุมัติแล้ว</Badge>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 text-amber-600" />
        <Badge className="bg-amber-100 text-amber-800">รอการอนุมัติ</Badge>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
            <CardTitle>เกิดข้อผิดพลาด</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => navigate("/", { replace: true })}>
              กลับไปหน้าแรก
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">สถานะการอนุมัติบัญชี</h1>
        <p className="text-muted-foreground mt-1">ข้อมูลและสถานะการอนุมัติของบัญชีของคุณ</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>ข้อมูลบัญชี</span>
            {userStatus && getStatusBadge(userStatus.status)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {userStatus ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">ชื่อผู้ใช้</p>
                  <p className="text-lg font-medium">{userStatus.UserName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">LINE ID</p>
                  <p className="text-lg font-medium">{userStatus.LineId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">อีเมล</p>
                  <p className="text-lg font-medium">{userStatus.Email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">เบอร์โทร</p>
                  <p className="text-lg font-medium">{userStatus.TelNumber || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">บริษัท</p>
                  <p className="text-lg font-medium">{userStatus.Company || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">สาขา</p>
                  <p className="text-lg font-medium">
                    {userStatus.BranchName || (userStatus.BranchId ? `สาขา ${userStatus.BranchId}` : "-")}
                  </p>
                </div>
              </div>

              {userStatus.status !== "ACTIVE" && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-900">
                    บัญชีของคุณกำลังรอการอนุมัติจากผู้ดูแลระบบ
                    หากได้รับการอนุมัติ คุณจะสามารถเข้าใช้งานระบบได้เต็มที่
                  </p>
                </div>
              )}

              {userStatus.status === "ACTIVE" && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-900">
                    บัญชีของคุณได้รับการอนุมัติแล้ว สามารถใช้งานระบบได้ปกติ
                  </p>
                </div>
              )}
            </>
          ) : (
            <p className="text-center text-muted-foreground py-8">ไม่พบข้อมูล</p>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => navigate("/", { replace: true })}>
          กลับไปหน้าแรก
        </Button>
      </div>
    </div>
  );
}
