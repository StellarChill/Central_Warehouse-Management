import React, { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building2, Package, AlertTriangle, Truck, ClipboardList, Activity, ArrowRight, ArrowLeft } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";

const WarehouseDashboardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Simulated KPI data
  const kpis = useMemo(() => ({
    totalItems: 1480,
    lowStock: 12,
    incomingShipments: 4,
    pendingRequisitions: 7,
    lastSyncMinutes: 5,
  }), []);

  // Simulated movement chart data
  const movementData = useMemo(() => [
    { day: 'จ', in: 120, out: 95 },
    { day: 'อ', in: 140, out: 110 },
    { day: 'พ', in: 90, out: 80 },
    { day: 'พฤ', in: 160, out: 130 },
    { day: 'ศ', in: 180, out: 150 },
    { day: 'ส', in: 70, out: 60 },
    { day: 'อา', in: 50, out: 40 },
  ], []);

  const enterOperations = () => {
    const role = user?.role;
    if (!role) return;
    if (["COMPANY_ADMIN", "PLATFORM_ADMIN", "PLATFORM_STAFF", "ADMIN", "WAREHOUSE_ADMIN"].includes(role)) {
      navigate(`/admin-company/${id}`);
    } else {
      navigate(`/warehouse-manager/${id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-6 py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-12 w-12 rounded-lg bg-blue-50 text-blue-600 items-center justify-center shadow-sm">
              <Building2 className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">ภาพรวมคลัง</h1>
              <p className="text-slate-500 text-sm">แดชบอร์ดสรุปข้อมูลจำลองก่อนเชื่อมระบบจริง</p>
              {user?.CompanyName && (
                <div className="mt-1 flex flex-wrap gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">บริษัท: {user.CompanyName}</span>
                  {user.CompanyCode && (
                    <span className="text-xs px-2 py-1 rounded-full bg-secondary/10 text-secondary-foreground font-medium">รหัส: {user.CompanyCode}</span>
                  )}
                </div>
              )}
            </div>
          </div>
          {id && (
            <Badge variant="secondary" className="w-fit">คลัง ID: {id}</Badge>
          )}
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1">
              <ArrowLeft className="h-4 w-4" /> กลับ
            </Button>
            <Button size="sm" onClick={enterOperations} className="gap-1">
              เข้าสู่การทำงาน <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          <Card className="hover:shadow-sm transition">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Package className="h-4 w-4 text-blue-500" />จำนวนรายการ</CardTitle></CardHeader>
            <CardContent className="pt-0"><div className="text-2xl font-semibold">{kpis.totalItems.toLocaleString()}</div></CardContent>
          </Card>
          <Card className="hover:shadow-sm transition">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" />ใกล้หมดสต๊อก</CardTitle></CardHeader>
            <CardContent className="pt-0"><div className="text-2xl font-semibold">{kpis.lowStock}</div></CardContent>
          </Card>
            <Card className="hover:shadow-sm transition">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Truck className="h-4 w-4 text-green-500" />กำลังรับเข้า</CardTitle></CardHeader>
            <CardContent className="pt-0"><div className="text-2xl font-semibold">{kpis.incomingShipments}</div></CardContent>
          </Card>
          <Card className="hover:shadow-sm transition">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><ClipboardList className="h-4 w-4 text-purple-500" />รออนุมัติ</CardTitle></CardHeader>
            <CardContent className="pt-0"><div className="text-2xl font-semibold">{kpis.pendingRequisitions}</div></CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2"><Activity className="h-4 w-4 text-slate-500" />การเคลื่อนไหว 7 วัน</CardTitle>
              <CardDescription>ข้อมูลจำลอง In / Out สำหรับทดสอบ UI</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={movementData} margin={{ left: 4, right: 8, top: 8, bottom: 4 }}>
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="in" stroke="#2563eb" strokeWidth={2} dot={false} name="นำเข้า" />
                    <Line type="monotone" dataKey="out" stroke="#dc2626" strokeWidth={2} dot={false} name="นำออก" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">สถานะระบบ</CardTitle>
              <CardDescription>ข้อมูลสถานะจำลอง</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span>Last sync</span><span className="font-medium">{kpis.lastSyncMinutes} นาที</span></div>
              <Separator />
              <div className="flex justify-between"><span>Cache hit rate</span><span className="font-medium">92%</span></div>
              <div className="flex justify-between"><span>API latency (avg)</span><span className="font-medium">184 ms</span></div>
              <div className="flex justify-between"><span>Queued jobs</span><span className="font-medium">3</span></div>
              <Separator />
              <div className="text-xs text-slate-500">* ตัวเลขทั้งหมดเป็นข้อมูลจำลอง</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WarehouseDashboardPage;
